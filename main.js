console.log("main.js running at", new Date().toLocaleString());

// load sounds
const soundsToLoad = ["siren.mp3"];
const sounds = {};

async function loadSounds(filePaths = soundsToLoad) {
    // promises make code asynchronous
    return new Promise((resolve) => {
        for (const filePath of filePaths) {
            // this fetches the audio file from the server
            sounds[filePath] = new Audio(`/sounds/${filePath}`);
        }
        resolve();
    });
}

loadSounds()
    .then(() => {
        console.log("all sounds loaded!");
    });

// request notification permissions
async function requestNotificationPermissions() {
    console.log("requesting notification permissions");

    await Notification.requestPermission()
        .then((result) => {
            if (result !== "granted") {
                alert("notification permissions not granted with: " + result);
            }
        });
}

setTimeout(requestNotificationPermissions, 1000);

// alert rules
// TODO: let user customise this
const rules = [
    {
        priority: 0,
        enabled: true,
        name: "Basic school",
        apply: (alerts) => {
            Object.assign(alerts, {
                "Before school": { time: translateRawTime("8:55") },
                "P1": { time: translateRawTime("10:00") },
                "P2": { time: translateRawTime("11:00") },
                "Interval": { time: translateRawTime("11:25") },
                "Form": { time: translateRawTime("11:45") },
                "P3": { time: translateRawTime("12:45") },
                "Lunch": { time: translateRawTime("13:25") },
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
            // change the first alerts to match the late start on wednesday
            if ((new Date()).getDay() === 3) {
                Object.assign(alerts, {
                    "Before school": { time: translateRawTime("9:25") },
                    "P1": { time: translateRawTime("10:15") },
                });
            }
        },
    },
    {
        priority: 2,
        enabled: true,
        name: "Techtorium",
        apply: (alerts) => {
            // remove all alerts for wednesday
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

// apply rules to generate alerts object
function applyRules() {
    // sort rules by priority so higher priority rules get applied on top of lower priority ones
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
            // don't send the alert if has already been activated
            if (alert.activated) continue;

            sendAlert(alert);

            // break so we don't check any more alerts
            break;
        } else {
            alert.activated = false;
        }
    }
}

// check time every second
setInterval(checkTime, 1_000);

function sendAlert(alert) {
    console.log("alerting!!!");

    sendNotification();

    // get the sound enabled setting from localStorage
    const soundEnabled = localStorage.getItem("enable-sound") === "true";
    if (soundEnabled) playAlertSound(alert.sound);

    // this flag makes sure the alert doesn't trigger twice
    alert.activated = true;
}

async function sendNotification() {
    // make sure the user has granted notification permissions
    await requestNotificationPermissions();

    const notification = new Notification("PACK UP!!!", {
        body: "PACK UP NOW!!!",
    });
    notification.onclick = function notificationClick() {
        console.log("notification clicked");
    };
}

function playAlertSound(soundName) {
    sounds[soundName].play();
}

// enable sound button
const enableSoundSwitch = document.getElementById("enable-sound");
enableSoundSwitch.addEventListener("change", (event) => {
    // set the stored value to the state of the checkbox
    const checked = event.target.checked;
    localStorage.setItem("enable-sound", checked);
});

// initialise the switch with the stored value
enableSoundSwitch.checked = localStorage.getItem("enable-sound") === "true";

// next alert display
const nextAlertDisplay = document.getElementById("next-alert");
const nextAlertRelativeDisplay = document.getElementById("next-alert-relative");

// this object is used to format times to relative time formats
const relativeTimeFormat = new Intl.RelativeTimeFormat({ numeric: "auto" });

function getNextAlert() {
    const now = new Date();

    // filter all alerts for just the ones after now
    const alertsAfterNow = Object.values(alerts)
        .filter((alert) => alert.time > now);

    // check if all of the alerts are done for today
    if (alertsAfterNow.length === 0) {
        return null;
    }

    // sort the alerts and get the first one
    return alertsAfterNow.sort((a, b) => a.time > b.time ? 1 : -1)[0];
}

function updateNextAlertDisplays() {
    const nextAlert = getNextAlert();

    if (nextAlert === null) {
        nextAlertDisplay.innerText = "Never";
        nextAlertRelativeDisplay.innerText = "No more alerts today";
        document.title = "No alerts - PackUpAlert";
        return;
    }

    // set the next alert display text to be the next alerts time in the HH:MM am/pm format
    nextAlertDisplay.innerText = nextAlert.time.toLocaleTimeString([], {
        hour: "numeric",
        minute: "numeric",
    });

    const now = new Date();

    // transform the next alert time into a format like "in 10 minutes" or "in 30 seconds"
    function getRelativeTime() {
        const relativeMS = nextAlert.time.getTime() - now.getTime();
        const relativeMinutes = relativeMS / 1000 / 60;

        // switch between minutes and seconds
        if (relativeMinutes > 1) {
            return relativeTimeFormat.format(
                Math.floor(relativeMinutes),
                "minutes",
            );
        } else {
            return relativeTimeFormat.format(
                Math.ceil(relativeMinutes * 60),
                "seconds",
            );
        }
    }

    const relativeTime = getRelativeTime();

    // show the relative time in the displays
    nextAlertRelativeDisplay.innerText = relativeTime;
    document.title = `alert ${relativeTime} - PackUpAlert`;
}
// update the displays once on page load
updateNextAlertDisplays();

// then update the displays every second
setInterval(updateNextAlertDisplays, 1_000);
