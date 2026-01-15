export const getStatusColorClass = (color) => {
    const map = {
        white: 'bg-white text-black border border-gray-200',
        gray_light: 'bg-gray-200 text-black',
        red_light: 'bg-red-200 text-red-900',
        orange_light: 'bg-orange-200 text-orange-900',
        green_light: 'bg-green-200 text-green-900',
        blue_light: 'bg-blue-200 text-blue-900',
        purple_light: 'bg-purple-200 text-purple-900',

        slate: 'bg-slate-600 text-white',
        gray: 'bg-gray-600 text-white',
        zinc: 'bg-zinc-600 text-white',
        neutral: 'bg-neutral-600 text-white',
        stone: 'bg-stone-600 text-white',

        red: 'bg-red-600 text-white font-bold',
        orange: 'bg-orange-600 text-white',
        amber: 'bg-amber-600 text-black',
        yellow: 'bg-yellow-500 text-black',
        lime: 'bg-lime-600 text-black',
        green: 'bg-green-600 text-white',
        emerald: 'bg-emerald-600 text-white',
        teal: 'bg-teal-600 text-white',
        cyan: 'bg-cyan-600 text-black',
        sky: 'bg-sky-500 text-black',
        blue: 'bg-blue-600 text-white',
        indigo: 'bg-indigo-600 text-white',
        violet: 'bg-violet-600 text-white',
        purple: 'bg-purple-600 text-white',
        fuchsia: 'bg-fuchsia-600 text-white',
        pink: 'bg-pink-600 text-white',
        rose: 'bg-rose-600 text-white',

        blue_dark: 'bg-blue-800 text-white',
        green_dark: 'bg-green-800 text-white',
        red_dark: 'bg-red-800 text-white',
        gray_dark: 'bg-gray-800 text-white',
        purple_dark: 'bg-purple-800 text-white',
        maroon: 'bg-red-900 text-white',
        navy: 'bg-blue-900 text-white',
    };
    return map[color] || map['gray'];
};

export const getColorPreviewClass = (color) => {
    const map = {
        white: 'bg-white border-2 border-gray-200',
        gray_light: 'bg-gray-300', red_light: 'bg-red-300', orange_light: 'bg-orange-300',
        green_light: 'bg-green-300', blue_light: 'bg-blue-300', purple_light: 'bg-purple-300',

        slate: 'bg-slate-500', gray: 'bg-gray-500', zinc: 'bg-zinc-500', neutral: 'bg-neutral-500', stone: 'bg-stone-500',
        red: 'bg-red-500', orange: 'bg-orange-500', amber: 'bg-amber-500', yellow: 'bg-yellow-500', lime: 'bg-lime-500',
        green: 'bg-green-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500', sky: 'bg-sky-500',
        blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500', purple: 'bg-purple-500', fuchsia: 'bg-fuchsia-500',
        pink: 'bg-pink-500', rose: 'bg-rose-500',
        blue_dark: 'bg-blue-700', green_dark: 'bg-green-700', red_dark: 'bg-red-700',
        gray_dark: 'bg-gray-700', purple_dark: 'bg-purple-700', maroon: 'bg-red-800', navy: 'bg-blue-800',
    };
    return map[color] || 'bg-gray-500';
};

export const colorOptions = [
    // Grises
    { value: 'white', label: 'Blanco' },
    { value: 'gray_light', label: 'Gris Claro' },
    { value: 'gray', label: 'Gris' },
    { value: 'gray_dark', label: 'Gris Oscuro' },
    { value: 'slate', label: 'Pizarra' },
    { value: 'zinc', label: 'Zinc' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'stone', label: 'Piedra' },

    // Rojos / Rosas
    { value: 'red_light', label: 'Rojo Claro' },
    { value: 'red', label: 'Rojo' },
    { value: 'red_dark', label: 'Rojo Oscuro' },
    { value: 'maroon', label: 'Granate' },
    { value: 'rose', label: 'Rosa Intenso' },
    { value: 'pink', label: 'Rosa' },

    // Naranjas / Amarillos
    { value: 'orange_light', label: 'Naranja Claro' },
    { value: 'orange', label: 'Naranja' },
    { value: 'amber', label: 'Ámbar' },
    { value: 'yellow', label: 'Amarillo' },

    // Verdes
    { value: 'lime', label: 'Lima' },
    { value: 'green_light', label: 'Verde Claro' },
    { value: 'green', label: 'Verde' },
    { value: 'green_dark', label: 'Verde Oscuro' },
    { value: 'emerald', label: 'Esmeralda' },
    { value: 'teal', label: 'Verde Azulado' },

    // Azules / Celestes
    { value: 'cyan', label: 'Cian' },
    { value: 'sky', label: 'Celeste' },
    { value: 'blue_light', label: 'Azul Claro' },
    { value: 'blue', label: 'Azul' },
    { value: 'blue_dark', label: 'Azul Oscuro' },
    { value: 'navy', label: 'Azul Marino' },
    { value: 'indigo', label: 'Índigo' },

    // Violetas
    { value: 'violet', label: 'Violeta' },
    { value: 'purple_light', label: 'Púrpura Claro' },
    { value: 'purple', label: 'Púrpura' },
    { value: 'purple_dark', label: 'Púrpura Oscuro' },
    { value: 'fuchsia', label: 'Fucsia' },
];
