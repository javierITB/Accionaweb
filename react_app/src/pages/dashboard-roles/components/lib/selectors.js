// Selector logic extracted from store.js

export const selectLeadsByStage = (state, stageId) =>
    state.leads.filter(lead => lead.stage_id === stageId);

// SCOPED SELECTORS (RBAC)
export const selectScopedLeads = (state) => {
    const { currentUser, leads } = state;
    if (!currentUser) return [];
    if (['admin', 'manager'].includes(currentUser.role)) return leads;
    return leads.filter(l => l.assigned_to === currentUser.id);
};

export const selectScopedTasks = (state) => {
    const { currentUser, tasks } = state;
    if (!currentUser) return [];
    if (['admin', 'manager'].includes(currentUser.role)) return tasks;

    const userLeadIds = state.leads
        .filter(l => l.assigned_to === currentUser.id)
        .map(l => l.id);

    return tasks.filter(t =>
        (t.assigned_to === currentUser.id) ||
        (t.lead_id && userLeadIds.includes(t.lead_id))
    );
};

export const selectRecentActivities = (state, limit = 10) =>
    state.activities.slice(0, limit);

export const selectUpcomingTasks = (state) =>
    state.tasks.filter(t => !t.completed);

// Contacts Module Selectors
export const selectContactsByCompany = (state, companyId) =>
    state.contacts.filter(contact => contact.company_id === companyId);

export const selectDealsByCompany = (state, companyId) =>
    state.leads.filter(lead => lead.company_id === companyId);

export const selectCompanyById = (state, companyId) =>
    state.companies.find(c => c.id === companyId);

export const selectContactById = (state, contactId) =>
    state.contacts.find(c => c.id === contactId);

// GLOBAL SEARCH REMOVED BY USER REQUEST
// export const selectGlobalSearch = (state, query) => { ... }

// HELPER: Dashboard Metrics (Advanced Analytics)

const getPeriodDates = (range, customRange) => {
    const now = new Date();
    let start, end, prevStart, prevEnd;
    const getQuarter = (d) => Math.floor((d.getMonth() + 3) / 3);

    switch (range) {
        case 'Trimestre':
            const q = getQuarter(now);
            start = new Date(now.getFullYear(), (q - 1) * 3, 1);
            end = new Date(now.getFullYear(), q * 3, 0);
            prevStart = new Date(start.getFullYear(), start.getMonth() - 3, 1);
            prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
            break;
        case 'Año':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            prevStart = new Date(now.getFullYear() - 1, 0, 1);
            prevEnd = new Date(now.getFullYear() - 1, 11, 31);
            break;
        case 'Personalizado':
            if (customRange?.from && customRange?.to) {
                start = new Date(customRange.from);
                end = new Date(customRange.to);
                const duration = end - start;
                prevEnd = new Date(start.getTime() - 1);
                prevStart = new Date(prevEnd.getTime() - duration);
            } else {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            }
            break;
        case 'Mes':
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
    }
    return { start, end, prevStart, prevEnd };
};

export const getDashboardMetrics = (state, dateRange = 'Mes', customRange = null) => {
    const { leads, activities, users, contacts, companies, stages } = state;
    const { start, end, prevStart, prevEnd } = getPeriodDates(dateRange, customRange);

    const inPeriod = (dateStr, s = start, e = end) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= s && d <= e;
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    // 1. Core KPIs
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value), 0);
    const activeLeads = leads.filter(l => l.stage_id !== 'stage-4' && l.stage_id !== 'stage-5').length;

    // Win Rate Logic
    const wonLeads = leads.filter(l => l.stage_id === 'stage-4');
    const lostLeads = leads.filter(l => l.stage_id === 'stage-5');
    const closedLeadsCount = wonLeads.length + lostLeads.length;
    const winRate = closedLeadsCount > 0 ? Math.round((wonLeads.length / closedLeadsCount) * 100) : 0;

    const periodWonLeads = leads.filter(l => l.stage_id === 'stage-4' && inPeriod(l.created_at));
    const periodRevenue = periodWonLeads.reduce((sum, l) => sum + Number(l.value), 0);

    // 2. Revenue Trend (Updated with Closed At logic)
    const revenueTrend = (() => {
        const grouped = {};
        const getKey = (d) => {
            const date = new Date(d);
            if (dateRange === 'Año') return date.toLocaleString('es-MX', { month: 'short' });
            if (dateRange === 'Trimestre') return date.toLocaleString('es-MX', { month: 'short' });
            return date.getDate();
        };

        let currentIter = new Date(start);
        while (currentIter <= end) {
            const k = getKey(currentIter);
            if (!grouped[k]) grouped[k] = 0;
            currentIter.setDate(currentIter.getDate() + 1);
        }

        leads.filter(l => l.stage_id === 'stage-4' && inPeriod(l.closed_at || l.created_at))
            .forEach(l => {
                const k = getKey(l.closed_at || l.created_at);
                if (grouped[k] !== undefined) grouped[k] += Number(l.value);
            });

        const trendData = [];
        let sortIter = new Date(start);
        while (sortIter <= end) {
            const k = getKey(sortIter);
            if (!trendData.find(d => d.name === k)) {
                trendData.push({ name: k, revenue: grouped[k] || 0 });
            }
            sortIter.setDate(sortIter.getDate() + 1);
        }
        return trendData;
    })();

    // 3. Funnel Data
    const funnelData = stages.sort((a, b) => a.position - b.position).map((stage) => {
        let cumulativeDeals = [];
        if (stage.id === 'stage-5') {
            cumulativeDeals = leads.filter(l => l.stage_id === 'stage-5' && inPeriod(l.created_at));
        } else {
            cumulativeDeals = leads.filter(l => {
                if (!inPeriod(l.created_at)) return false;
                if (l.stage_id === 'stage-5') return false;
                const currentStage = stages.find(s => s.id === l.stage_id);
                const currentPos = currentStage ? currentStage.position : 0;
                return currentPos >= stage.position;
            });
        }

        const count = cumulativeDeals.length;
        const totalValue = cumulativeDeals.reduce((sum, l) => sum + Number(l.value), 0);
        const stageDeals = leads.filter(l => l.stage_id === stage.id && inPeriod(l.created_at));

        // Mock Conversion for display
        const nextStage = stages.find(s => s.position === stage.position + 1);
        const nextStageCount = nextStage
            ? leads.filter(l => l.stage_id === nextStage.id && inPeriod(l.created_at)).length
            : 0;

        let conversionRate = 0;
        if (stage.position === 5) conversionRate = 0;
        else if (stage.position === 4) conversionRate = 100;
        else conversionRate = count > 0 ? Math.round((nextStageCount / (count || 1)) * 100) : 0;

        // Mock Avg Days
        const avgDays = count > 0 ? Math.floor(Math.random() * 20) : 0;

        return {
            id: stage.id,
            name: stage.name,
            count: count,
            value: totalValue,
            conversionNext: conversionRate,
            avgDays: avgDays,
            deals: stageDeals,
            fill: COLORS[(stage.position - 1) % COLORS.length] || '#8884d8'
        };
    });

    // 4. Contacts By Seller
    const contactsBySeller = users
        .filter(u => u.role === 'sales')
        .map(user => ({
            name: user.name,
            value: contacts.filter(c => c.created_by === user.id && inPeriod(c.created_at)).length
        })).sort((a, b) => b.value - a.value);

    // 5. Conversion By Source
    const dealsBySource = leads
        .filter(l => inPeriod(l.created_at))
        .reduce((acc, lead) => {
            const source = lead.source || 'Desconocido';
            if (!acc[source]) acc[source] = { total: 0, won: 0, wonValue: 0, totalDays: 0, wonCount: 0 };
            acc[source].total++;
            if (lead.stage_id === 'stage-4') {
                acc[source].won++;
                acc[source].wonValue += Number(lead.value);
                const created = new Date(lead.created_at);
                const closed = lead.closed_at ? new Date(lead.closed_at) : new Date();
                const days = Math.max(1, Math.floor((closed - created) / (1000 * 60 * 60 * 24)));
                acc[source].totalDays += days;
                acc[source].wonCount++;
            }
            return acc;
        }, {});

    const conversionBySource = Object.keys(dealsBySource).map((source, index) => {
        const data = dealsBySource[source];
        const rate = Math.round((data.won / data.total) * 100) || 0;
        const avgTicket = data.won > 0 ? Math.round(data.wonValue / data.won) : 0;
        const avgDays = data.wonCount > 0 ? Math.round(data.totalDays / data.wonCount) : 0;

        let stars = 1;
        if (rate > 20) stars = 5;
        else if (rate > 10) stars = 3;

        return {
            name: source,
            value: data.total,
            count: data.total,
            rate,
            avgTicket,
            avgDays,
            stars,
            fill: COLORS[index % COLORS.length]
        };
    }).sort((a, b) => b.rate - a.rate);

    const recommendation = conversionBySource.length > 0 ? `Invertir más en ${conversionBySource[0].name}` : "Recopilando datos...";

    // 6. Seller Performance
    const sellerPerformance = users
        .filter(u => u.role === 'sales')
        .map(user => {
            const userDeals = leads.filter(l => l.assigned_to === user.id && inPeriod(l.created_at));
            const userWon = userDeals.filter(l => l.stage_id === 'stage-4');
            const userClosed = userDeals.filter(l => l.stage_id === 'stage-4' || l.stage_id === 'stage-5');
            const rate = userClosed.length > 0 ? Math.round((userWon.length / userClosed.length) * 100) : 0;
            const value = userWon.length > 0 ? Math.round(userWon.reduce((sum, l) => sum + Number(l.value), 0) / userWon.length) : 0;
            const userContacts = contacts.filter(c => c.created_by === user.id && inPeriod(c.created_at));

            // Mock Variation
            const variation = Math.floor(Math.random() * 20) - 5;

            return {
                name: user.name,
                winRate: rate,
                avgValue: value,
                totalDeals: userDeals.length,
                totalRevenue: userWon.reduce((sum, l) => sum + Number(l.value), 0),
                totalContacts: userContacts.length,
                variation: variation,
                lastActivity: new Date().toISOString() // Mock
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 7. Industry Data
    const valueByIndustry = companies.reduce((acc, comp) => {
        const industry = comp.industry || 'Otros';
        const val = leads.filter(l => l.company_id === comp.id && l.stage_id === 'stage-4').reduce((sum, l) => sum + Number(l.value), 0);
        acc[industry] = (acc[industry] || 0) + val;
        return acc;
    }, {});
    const industryData = Object.keys(valueByIndustry).map(ind => ({ name: ind, value: valueByIndustry[ind] })).sort((a, b) => b.value - a.value);

    // 9. New Contacts KPI Metrics
    const currentContacts = contacts.filter(c => inPeriod(c.created_at));
    const lastMonthContacts = contacts.filter(c => inPeriod(c.created_at, prevStart, prevEnd));
    const newContactsGrowth = lastMonthContacts.length > 0
        ? Math.round(((currentContacts.length - lastMonthContacts.length) / lastMonthContacts.length) * 100)
        : (currentContacts.length > 0 ? 100 : 0);

    // 10. General Conversion KPI (Migration Fix)
    const prevWonLeads = leads.filter(l => l.stage_id === 'stage-4' && inPeriod(l.closed_at || l.created_at, prevStart, prevEnd));
    const prevLostLeads = leads.filter(l => l.stage_id === 'stage-5' && inPeriod(l.closed_at || l.created_at, prevStart, prevEnd));
    const prevClosed = prevWonLeads.length + prevLostLeads.length;
    const prevWinRate = prevClosed > 0 ? Math.round((prevWonLeads.length / prevClosed) * 100) : 0;
    const conversionGrowth = winRate - prevWinRate;

    return {
        totalValue,
        periodRevenue,
        activeLeads,
        winRate,
        revenueTrend,
        funnelData,
        contactsBySeller,
        conversionBySource,
        sellerPerformance,
        industryData,
        pipelineVelocity: [],
        recentActivities: activities.slice(0, 10),
        agentPerformance: sellerPerformance.map(s => ({ name: s.name, sales: s.totalRevenue })),
        newContactsKPI: {
            count: currentContacts.length,
            growth: newContactsGrowth,
            topSource: conversionBySource[0]?.name || 'N/A',
            recent: currentContacts.slice(0, 5)
        },
        pipelineEvolution: { data: [], alerts: [] },
        recommendation,
        riskKPI: { count: 0, totalValue: 0, deals: [] },
        generalConversionKPI: {
            rate: winRate,
            growth: conversionGrowth,
            funnel: funnelData
        },
        winRateKPI: {
            rate: winRate,
            growth: conversionGrowth,
            target: 35, // Mock target
            gap: winRate - 35
        }
    };
};
