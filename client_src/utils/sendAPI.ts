declare const TORN_API_URL: string;

const sendAPI = async (endpoint: string, data: any) => await fetch(`${TORN_API_URL}/api${endpoint}`, {
    method: `POST`,
    body: data,
    headers: {
        [`Content-Type`]: `x-www-form-urlencoded`
    }
});

export default sendAPI;
