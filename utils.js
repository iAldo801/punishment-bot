const currentDateFormatted = () => {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return `${month}-${day}-${year}`;
};

const log = console.log;

module.exports = {
  currentDateFormatted,
  log,
};
