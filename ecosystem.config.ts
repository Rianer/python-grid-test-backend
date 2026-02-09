module.exports = {
    apps: [
        {
            name: "grid-test-backend",
            script: "./dist/app.js",
            instances: "max", // or 1–2 depending on CPU
            exec_mode: "cluster", // better perf on multi-core
            env: {
                NODE_ENV: "production",
                PORT: 3000, // or your port
            },
        },
    ],
};
