const success = (message = "") => {
    console.log(message);
};

const error = (message = "") => {
    console.error(message);
};

const warning = (message = "") => {
    console.warn(message);
};

const info = (message = "") => {
    console.info(message);
};

const print = (message = "") => {
    process.stdout.write(message);
};

module.exports = {
    success,
    error,
    warning,
    info,
    print
};
