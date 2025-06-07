/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    JOBDIVA_USERNAME_USA: process.env.JOBDIVA_USERNAME_USA,
    JOBDIVA_PASSWORD_USA: process.env.JOBDIVA_PASSWORD_USA,
    JOBDIVA_CLIENT_ID_USA: process.env.JOBDIVA_CLIENT_ID_USA,
    JOBDIVA_USERNAME_INDIA: process.env.JOBDIVA_USERNAME_INDIA,
    JOBDIVA_PASSWORD_INDIA: process.env.JOBDIVA_PASSWORD_INDIA,
    JOBDIVA_CLIENT_ID_INDIA: process.env.JOBDIVA_CLIENT_ID_INDIA,
  },
}

module.exports = nextConfig 