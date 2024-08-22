const getMySqlDate = () =>
    new Date().toISOString().replace('T', ' ').slice(0, -5);

export { getMySqlDate };
