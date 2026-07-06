const allowedOrigins = [
    process.env.CLIENT_ADMIN_URL || 'http://localhost:5173',
    process.env.CLIENT_USER_URL || 'http://localhost:5174',
    process.env.CLIENT_EXPO_URL || 'http://localhost:8081',
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    maxAge: 600,
};
//Exporta la configuracion de CORS para ser utilizada en otros archivos
export {corsOptions};