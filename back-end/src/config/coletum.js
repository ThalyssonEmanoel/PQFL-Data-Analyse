const required = (name, value) => {
  if (!value) throw new Error(`Variável de ambiente ${name} é obrigatória`);
  return value;
};

export const coletumConfig = {
  baseUrl: required("COLETUM_BASE_URL", process.env.COLETUM_BASE_URL),
  formId: required("COLETUM_FORM_ID", process.env.COLETUM_FORM_ID),
  token: required("COLETUM_TOKEN", process.env.COLETUM_TOKEN),
  pageSize: 500,
  maxRequestsPerRun: 4,
};

export default coletumConfig;
