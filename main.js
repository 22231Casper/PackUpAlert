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

// TODO: let user customise this
const rules = [
    {
        priority: 0,
        name: "Basic school",
        apply: (alerts) => {
            Object.assign(alerts, {
                "P1": { time: translateRawTime("10:00") },
                "P2": { time: translateRawTime("11:00") },
                "Interval": { time: translateRawTime("11:30") },
                "Form": { time: translateRawTime("11:45") },
                "P3": { time: translateRawTime("12:45") },
                "Lunch": { time: translateRawTime("13:30") },
                "P4": { time: translateRawTime("14:30") },
                "P5": { time: translateRawTime("15:30") },
            });
        },
    },
    {
        priority: 1,
        name: "Wednesday shift",
        apply: (alerts) => {
            if ((new Date()).getDay() === 3) {
                Object.assign(alerts, {
                    "P1": { time: translateRawTime("10:15") },
                });
            }
        },
    },
];

function translateRawTime(time, offset = alertOffsetMinutes) {
    const split = time.split(":");
    const date = new Date();
    date.setHours(Number(split[0]));
    date.setMinutes(Number(split[1]) + offset);
    date.setSeconds(0, 0);
    return date;
}

const alerts = {};

function applyRules() {
    rules.sort((a, b) => a.priority - b.priority);
    for (const rule of rules) {
        console.log("applying rule:", rule);

        rule.apply(alerts);
    }

    Object.values(alerts).forEach((alert) => alert.activated = false);
}

// TODO: run this when user changes the rules
applyRules();

console.log(alerts);

function checkTime() {
    const now = new Date();
    //console.log("now:", (now.getTime() / 1000).toFixed(0));
    const hours = now.getHours();
    const minutes = now.getMinutes();
    for (const alert of Object.values(alerts)) {
        //console.log("checking alert:", alert);
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
