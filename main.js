console.log("main.js running at", new Date().toLocaleString());

// load sounds
const soundsToLoad = ["siren.mp3"];
const sounds = {};
globalThis.sounds = sounds;

async function loadSounds(filePaths = soundsToLoad) {
    return new Promise((resolve) => {
        for (const filePath of filePaths) {
            sounds[filePath] = new Audio(`/sounds/${filePath}`);
        }
        resolve();
    });
}

loadSounds();

// request notification permissions
async function requestNotification() {
    console.log("requesting notification permissions");

    await Notification.requestPermission().then((result) => {
        if (result !== "granted") {
            alert("notification permissions not granted with: " + result);
        }
    });
}

await requestNotification();

// alert rules
// TODO: let user customise this
const rules = [
    {
        priority: 0,
        enabled: true,
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
        enabled: true,
        name: "Wednesday shift",
        apply: (alerts) => {
            if ((new Date()).getDay() === 3) {
                Object.assign(alerts, {
                    "P1": { time: translateRawTime("10:15") },
                });
            }
        },
    },
    {
        priority: 2,
        enabled: false,
        name: "Techtorium",
        apply: (alerts) => {
            if ((new Date()).getDay() === 3) {
                Object.keys(alerts).forEach((k) => {
                    delete alerts[k];
                });
            }
        },
    },
];

// this means alerts will activate one minute before their set time
const alertOffsetMinutes = -1;

// translate times (e.g. "15:30") into Date objects
function translateRawTime(time, offset = alertOffsetMinutes) {
    const split = time.split(":");
    const date = new Date();
    date.setHours(Number(split[0]));
    date.setMinutes(Number(split[1]) + offset);
    date.setSeconds(0, 0);
    return date;
}

// alerts object that holds all of the alerts
const alerts = {};
globalThis.alerts = alerts;

// apply rules to generate alerts object
function applyRules() {
    rules.sort((a, b) => a.priority - b.priority);

    for (const rule of rules) {
        if (rule.enabled) rule.apply(alerts);
    }

    // set defaults for alerts
    for (const alert of Object.values(alerts)) {
        alert.activated = false;
        alert.sound = "siren.mp3";
    }
}

// TODO: run this when user changes the rules
applyRules();

// check if an alert should be sent right now
function checkTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    for (const alert of Object.values(alerts)) {
        if (
            alert.time.getHours() === hours &&
            alert.time.getMinutes() === minutes
        ) {
            if (alert.activated) continue;
            sendAlert(alert);
            break;
        } else {
            alert.activated = false;
        }
    }
}

// check every second
setInterval(checkTime, 1_000);

function sendAlert(alert) {
    console.log("alerting!!!");
    sendNotification();
    const soundEnabled = localStorage.getItem("enable-sound") === "true";
    if (soundEnabled) playAlertSound(alert.sound);
    alert.activated = true;
}

function sendNotification() {
    const notification = new Notification("PACK UP!!!", {
        body: "PACK UP NOW!!!",
    });
    notification.onclick = function notificationClick() {
        console.log("notification clicked");
    };

    console.log("created notification:", notification);
}

function playAlertSound(soundName) {
    sounds[soundName].play();
}

// enable sound button
const enableSoundSwitch = document.getElementById("enable-sound");
enableSoundSwitch.addEventListener("change", (event) => {
    const checked = event.target.checked;
    localStorage.setItem("enable-sound", checked);
});

enableSoundSwitch.checked = localStorage.getItem("enable-sound") === "true";

// next alert display
const nextAlertDisplay = document.getElementById("next-alert");
const nextAlertRelativeDisplay = document.getElementById("next-alert-relative");

const rtf = new Intl.RelativeTimeFormat({ numeric: "auto" });
function updateNextAlertDisplay() {
    const now = new Date();

    let nextAlert = { time: Infinity };
    for (const alert of Object.values(alerts)) {
        if (now < alert.time && alert.time < nextAlert.time) nextAlert = alert;
    }

    nextAlertDisplay.innerText = nextAlert.time.toLocaleTimeString();

    const relativeMS = nextAlert.time.getTime() - now.getTime();
    const relativeMinutes = relativeMS / 1000 / 60;
    const relativeString = rtf.format(relativeMinutes, "minutes");

    nextAlertRelativeDisplay.innerText = relativeString;
}
updateNextAlertDisplay();

setInterval(updateNextAlertDisplay, 1000);

// testing buttons
function testAlert() {
    console.log("sending test alert");
    sendAlert({});
}
const testAlertButton = document.getElementById(
    "testAlertButton",
);
