function timedifferenceinminutes(dateFuture, dateNow) {
    let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;
    const minutes = Math.floor(diffInMilliSeconds / 60) % 60;
    return minutes;
};
module.exports = { timedifferenceinminutes };