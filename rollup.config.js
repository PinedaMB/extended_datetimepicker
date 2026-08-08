import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

export default [
    // 1. Versión sin minificar (para desarrollo / debugging)
    {
        input: 'src/js/jquery.extended.datetimepicker.js',
        external: ['jquery'], // No empaqueta jQuery dentro del bundle
        output: {
            file: 'dist/jquery.extended.datetimepicker.js',
            format: 'iife',
            name: 'ExtendedDateTimePicker',
            globals: {
                jquery: 'jQuery'
            }
        },
        plugins: [
            postcss({
                extract: true // Extrae el CSS a dist/jquery.extended.datetimepicker.css
            })
        ]
    },
    // 2. Versión minificada (para producción)
    {
        input: 'src/js/jquery.extended.datetimepicker.js',
        external: ['jquery'],
        output: {
            file: 'dist/jquery.extended.datetimepicker.min.js',
            format: 'iife',
            name: 'ExtendedDateTimePicker',
            globals: {
                jquery: 'jQuery'
            }
        },
        plugins: [
            postcss({ extract: 'jquery.extended.datetimepicker.min.css', minimize: true }),
            terser()
        ]
    }
];