const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'University Grade Portal API',
            version: '1.0.0',
            description: 'API documentation for the University Grade Portal system. For detailed workflows, role guides, and system features, see [API_DOCUMENTATION.md](https://github.com/your-repo/university-grade-portal/blob/main/API_DOCUMENTATION.md).',
            contact: {
                name: 'API Support',
                email: 'support@universityportal.edu'
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsDoc(options);

module.exports = specs;
