export const getStatusColorClass = (rawColor) => {
    // Normalize input: lowercase, trim, replace spaces with underscores (for values like 'Purple Light')
    const color = rawColor?.toLowerCase().trim().replace(/\s+/g, '_') || 'gray';

    const map = {
        // Basic Colors (Consolidated)
        white: 'bg-white text-black border border-gray-200',
        gray_light: 'bg-gray-200 text-black',

        // Gray Group (All to Gray)
        gray: 'bg-gray-600 text-white',
        gray_dark: 'bg-gray-600 text-white',
        slate: 'bg-gray-600 text-white',
        zinc: 'bg-gray-600 text-white',
        neutral: 'bg-gray-600 text-white',
        stone: 'bg-gray-600 text-white',
        gris: 'bg-gray-600 text-white',
        pizarra: 'bg-gray-600 text-white',
        gris_claro: 'bg-gray-600 text-white',

        // Red Group (All to Red)
        red: 'bg-red-600 text-white font-bold',
        rose: 'bg-red-600 text-white font-bold',
        maroon: 'bg-red-600 text-white font-bold',
        rojo: 'bg-red-600 text-white font-bold',
        red_light: 'bg-red-600 text-white font-bold',
        red_dark: 'bg-red-600 text-white font-bold',
        rojo_claro: 'bg-red-600 text-white font-bold',

        // Orange Group (All to Orange)
        orange: 'bg-orange-600 text-white',
        amber: 'bg-orange-600 text-white',
        naranja: 'bg-orange-600 text-white',
        ambar: 'bg-orange-600 text-white',
        orange_light: 'bg-orange-600 text-white',
        naranja_claro: 'bg-orange-600 text-white',
        ambar_claro: 'bg-orange-600 text-white',

        // Yellow Group (All to Yellow)
        yellow: 'bg-yellow-500 text-black',
        gold: 'bg-yellow-500 text-black',
        amarillo: 'bg-yellow-500 text-black',
        yellow_light: 'bg-yellow-500 text-black',
        amarillo_claro: 'bg-yellow-500 text-black',

        // Green Group (All to Green)
        green: 'bg-green-600 text-white',
        emerald: 'bg-green-600 text-white',
        lime: 'bg-green-600 text-white',
        teal: 'bg-green-600 text-white',
        verde: 'bg-green-600 text-white',
        lima: 'bg-green-600 text-white',
        esmeralda: 'bg-green-600 text-white',
        verde_azulado: 'bg-green-600 text-white',
        green_light: 'bg-green-600 text-white',
        green_dark: 'bg-green-600 text-white',
        lima_claro: 'bg-green-600 text-white',
        verde_claro: 'bg-green-600 text-white',
        esmeralda_claro: 'bg-green-600 text-white',
        verde_azulado_claro: 'bg-green-600 text-white',

        // Blue Group (Incorporating Cyan/Celeste/Sky -> Blue)
        blue: 'bg-blue-600 text-white',
        indigo: 'bg-blue-600 text-white',
        navy: 'bg-blue-600 text-white',
        cyan: 'bg-blue-600 text-white',
        sky: 'bg-blue-600 text-white',
        celeste: 'bg-blue-600 text-white',
        azul: 'bg-blue-600 text-white',
        cielo: 'bg-blue-600 text-white',
        indigo: 'bg-blue-600 text-white',
        blue_light: 'bg-blue-600 text-white',
        blue_dark: 'bg-blue-600 text-white',
        azul_claro: 'bg-blue-600 text-white',
        cielo_claro: 'bg-blue-600 text-white',
        celeste_claro: 'bg-blue-600 text-white',
        indigo_claro: 'bg-blue-600 text-white',

        // Purple Group (All to Purple)
        purple: 'bg-purple-600 text-white',
        violet: 'bg-purple-600 text-white',
        fuchsia: 'bg-purple-600 text-white',
        morado: 'bg-purple-600 text-white',
        purpura: 'bg-purple-600 text-white',
        violeta: 'bg-purple-600 text-white',
        fucsia: 'bg-purple-600 text-white',
        purple_light: 'bg-purple-600 text-white',
        purple_dark: 'bg-purple-600 text-white',
        violeta_claro: 'bg-purple-600 text-white',
        morado_claro: 'bg-purple-600 text-white',
        purpura_claro: 'bg-purple-600 text-white',
        fucsia_claro: 'bg-purple-600 text-white',

        // Pink Group (All to Pink)
        pink: 'bg-pink-600 text-white',
        magenta: 'bg-pink-600 text-white',
        rosa: 'bg-pink-600 text-white',
        rosado: 'bg-pink-600 text-white',
        pink_light: 'bg-pink-600 text-white',
        rosa_claro: 'bg-pink-600 text-white',
        rosado_claro: 'bg-pink-600 text-white',

        // Misc
        blanco: 'bg-white text-black border border-gray-200',
    };
    return map[color] || map['gray'];
};

export const getColorPreviewClass = (rawColor) => {
    // Normalize input
    const color = rawColor?.toLowerCase().trim().replace(/\s+/g, '_') || 'gray';

    const map = {
        // Basic Colors (Strictly 8 + White)
        white: 'bg-white border-2 border-gray-200',
        gray_light: 'bg-gray-300', // Kept for legacy display if needed, but not in options

        // Gray Group
        gray: 'bg-gray-500',
        gray_dark: 'bg-gray-500',
        slate: 'bg-gray-500', zinc: 'bg-gray-500', neutral: 'bg-gray-500', stone: 'bg-gray-500',
        gris: 'bg-gray-500', pizarra: 'bg-gray-500', gris_claro: 'bg-gray-500',

        // Red Group
        red: 'bg-red-500',
        red_light: 'bg-red-500', red_dark: 'bg-red-500',
        rose: 'bg-red-500', maroon: 'bg-red-500',
        rojo: 'bg-red-500', rojo_claro: 'bg-red-500',

        // Orange Group
        orange: 'bg-orange-500',
        orange_light: 'bg-orange-500', amber: 'bg-orange-500',
        naranja: 'bg-orange-500', naranja_claro: 'bg-orange-500', ambar: 'bg-orange-500', ambar_claro: 'bg-orange-500',

        // Yellow Group
        yellow: 'bg-yellow-500',
        yellow_light: 'bg-yellow-500', gold: 'bg-yellow-500',
        amarillo: 'bg-yellow-500', amarillo_claro: 'bg-yellow-500',

        // Green Group
        green: 'bg-green-500',
        green_light: 'bg-green-500', green_dark: 'bg-green-500',
        emerald: 'bg-green-500', lime: 'bg-green-500', teal: 'bg-green-500',
        verde: 'bg-green-500', verde_claro: 'bg-green-500', lima: 'bg-green-500', lima_claro: 'bg-green-500',
        esmeralda: 'bg-green-500', esmeralda_claro: 'bg-green-500', verde_azulado: 'bg-green-500', verde_azulado_claro: 'bg-green-500',

        // Blue Group (Incorporating Cyan/Sky/Celeste -> Blue)
        blue: 'bg-blue-500',
        blue_light: 'bg-blue-500', blue_dark: 'bg-blue-500',
        indigo: 'bg-blue-500', navy: 'bg-blue-500',
        cyan: 'bg-blue-500', sky: 'bg-blue-500', celeste: 'bg-blue-500',
        azul: 'bg-blue-500', azul_claro: 'bg-blue-500', cielo: 'bg-blue-500', cielo_claro: 'bg-blue-500',
        celeste_claro: 'bg-blue-500', indigo_claro: 'bg-blue-500',

        // Purple Group
        purple: 'bg-purple-500',
        purple_light: 'bg-purple-500', purple_dark: 'bg-purple-500',
        violet: 'bg-purple-500', fuchsia: 'bg-purple-500',
        morado: 'bg-purple-500', morado_claro: 'bg-purple-500', purpura: 'bg-purple-500', purpura_claro: 'bg-purple-500',
        violeta: 'bg-purple-500', violeta_claro: 'bg-purple-500', fucsia: 'bg-purple-500', fucsia_claro: 'bg-purple-500',

        // Pink Group
        pink: 'bg-pink-500',
        pink_light: 'bg-pink-500', magenta: 'bg-pink-500',
        rosa: 'bg-pink-500', rosa_claro: 'bg-pink-500', rosado: 'bg-pink-500', rosado_claro: 'bg-pink-500',

        // Misc
        blanco: 'bg-white border-2 border-gray-200',
    };
    return map[color] || 'bg-gray-500';
};

export const colorOptions = [
    { value: 'white', label: 'Blanco' },
    { value: 'gray', label: 'Gris' },
    { value: 'red', label: 'Rojo' },
    { value: 'orange', label: 'Naranja' },
    { value: 'yellow', label: 'Amarillo' },
    { value: 'green', label: 'Verde' },
    { value: 'blue', label: 'Azul' },
    { value: 'purple', label: 'Púrpura' },
    { value: 'pink', label: 'Rosa' },
];

export const findConfigForCategory = (ticketConfigs, categoryName) => {
    if (!ticketConfigs || !categoryName) return null;

    // 1. Coincidencia exacta
    let config = ticketConfigs.find(c => c.key === categoryName);
    if (config) return config;

    // 2. Coincidencia insensible a mayúsculas
    const lowerName = categoryName.toLowerCase();
    config = ticketConfigs.find(c => c.key?.toLowerCase() === lowerName);
    if (config) return config;

    // 3. Slug match (reemplazar espacios con guiones bajos)
    const slug = lowerName.replace(/\s+/g, '_');
    config = ticketConfigs.find(c => c.key === slug);
    if (config) return config;

    // 4. Intentar normalizar claves (eliminar acentos)
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    config = ticketConfigs.find(c => normalize(c.key || '') === normalize(slug));

    return config || null;
};

export const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': case 'aprobado': return 'CheckCircle';
        case 'pending': case 'pendiente': return 'Clock';
        case 'in_review': case 'en_revision': return 'Eye';
        case 'rejected': case 'rechazado': return 'XCircle';
        case 'borrador': return 'FileText';
        case 'signed': case 'firmado': return 'CheckSquare';
        case 'archivado': return 'Folder';
        default: return 'Circle';
    }
};

export const getDefaultStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': case 'pendiente': return 'bg-error text-error-foreground';
        case 'in_review': case 'en_revision': return 'bg-secondary text-secondary-foreground';
        case 'approved': case 'aprobado': return 'bg-warning text-warning-foreground';
        case 'signed': case 'firmado': return 'bg-success text-success-foreground';
        case 'finalizado': return 'bg-blue-600 text-white'; // Mapped to Blue
        case 'archivado': return 'bg-gray-600 text-white'; // Mapped to Gray
        default: return 'bg-muted text-muted-foreground';
    }
};

export const formatStatusText = (status) => {
    if (!status) return 'Desconocido';
    const statusMap = {
        'approved': 'APROBADO',
        'aprobado': 'APROBADO',
        'rejected': 'RECHAZADO',
        'pending': 'PENDIENTE',
        'review': 'EN REVISIÓN',
        'en_revision': 'EN REVISIÓN',
        'finalized': 'FINALIZADO',
        'finalizado': 'FINALIZADO',
        'archivado': 'ARCHIVADO',
    };
    return statusMap[status.toLowerCase()] || status.replace(/_/g, ' ').toUpperCase();
};
