module.exports = {
  apps: [
    {
      name: 'patient-service',
      script: 'dist/main.js',
      interpreter_args: '--require ./.pnp.cjs',
    },
  ],
};
