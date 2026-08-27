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
