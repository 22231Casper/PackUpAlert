console.log("main.js running at", new Date().toLocaleString());

const requestNotificationButton = document.getElementById(
    "requestNotificationButton",
);
requestNotificationButton.onclick = requestNotification;

async function requestNotification() {
    console.log("requesting notification permissions");
    await Notification.requestPermission().then((result) => {
        console.log(result);
        if (result !== "granted") {
            alert("notification permissions not granted with: " + result);
        }
    });
}

await requestNotification();

function sendNotification() {
    const notification = new Notification("PACK UP!!!", {
        body: "PACK UP NOW!!!",
    });
    notification.onclick = function notificationClick() {
        console.log("notification clicked");
    };

    console.log("created notification:", notification);
}

const sendNotificationButton = document.getElementById(
    "sendNotificationButton",
);
sendNotificationButton.onclick = sendNotification;

const alertOffsetMinutes = -1;
const alertTimesRaw = [
    "10:00", // P1
    "11:00", // P2
    "11:30", // Interval
    "11:45", // Form
    "12:45", // P3
    "13:30", // Lunch
    "14:30", // P4
    "15:30", // P5
];

function translateRawTimes(times) {
    return times.map((time) => {
        const split = time.split(":");
        const date = new Date();
        date.setHours(Number(split[0]));
        date.setMinutes(Number(split[1]) + alertOffsetMinutes);
        return {
            time: date,
            activated: false,
        };
    });
}

const alertTimes = translateRawTimes(alertTimesRaw);

console.log(alertTimes);

function checkTime() {
    const now = new Date();
    console.log("now:", (now.getTime() / 1000).toFixed(0));
    const hours = now.getHours();
    const minutes = now.getMinutes();
    for (const alert of alertTimes) {
        console.log("checking time:", alert);
        if (
            alert.time.getHours() === hours &&
            alert.time.getMinutes() === minutes
        ) {
            if (alert.activated) continue;
            console.log("alerting!!!");
            sendNotification();
            alert.activated = true;
        } else {
            alert.activated = false;
        }
    }
}

setInterval(checkTime, 1000);
