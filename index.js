import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js'
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js'
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js'
import { getFirestore, doc, onSnapshot, setDoc, getDoc, addDoc, deleteDoc, collection } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js'

// Make password field submit form on enter.
document.getElementById("password").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      signInOrCreate();
    }
});

const firebaseConfig = {
    apiKey: "AIzaSyAOxa1tqQgoTPgswVW-7mTQBEfiYVrL2mI",
    authDomain: "daysoffplanner.firebaseapp.com",
    projectId: "daysoffplanner",
    storageBucket: "daysoffplanner.appspot.com",
    messagingSenderId: "999511004889",
    appId: "1:999511004889:web:eb57c65f29eeffb97bd0c8",
    measurementId: "G-6CX91Q6S19"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

var currentUser = null;
var activeSubscription = false;
var hasLoadedData = false;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    document.getElementById("signInOrCreate").onclick = signInOrCreate;
    document.getElementById("sign-out-button").onclick = trySignOut;
    document.getElementById("unsubscribe-confirm").onclick = unsubscribe;
    if (user) {
        [...document.getElementsByClassName("hide-logged-in")].forEach(el => {
            el.style.display = "none";
        });
        [...document.getElementsByClassName("hide-logged-out")].forEach(el => {
            el.style.display = "inherit";
        });
        document.getElementById("container").style.marginLeft = "0%";
        document.getElementById("container").style.width = "100%";

        document.getElementById("password").value = "";
        console.log("logged in");
        updateActiveSubscription(() => {
            console.log("HERE")
            if (!activeSubscription) {
                subscribe();
            }
            loadData();
        });
    } else {
        [...document.getElementsByClassName("hide-logged-in")].forEach(el => {
            el.style.display = "inherit";
        });
        [...document.getElementsByClassName("hide-logged-out")].forEach(el => {
            el.style.display = "none";
        });
        document.getElementById("container").style.marginLeft = "25%";
        document.getElementById("container").style.width = "75%";
    }
});

function setSignInState(loading) {
    if (loading) {
        document.getElementById("signInOrCreateText").style.display = "none";
        document.getElementById("signInOrCreateLoading").style.display = "inherit";
    } else {
        document.getElementById("signInOrCreateText").style.display = "inherit";
        document.getElementById("signInOrCreateLoading").style.display = "none";
        document.getElementById("password").value = "";
    }
}

function firebaseErrorCodeToString(error) {
    console.log(error);
    switch (error) {
        case "auth/invalid-email":
            return "Valid email required";
        case "auth/missing-password":
            return "Password required";
        case "auth/weak-password":
            return "Need a stronger password";
        case "auth/email-already-in-use":
            return "Invalid email or password";
        case "auth/too-many-requests":
            return "Try again in a few minutes, cowboy";
        default:
            return error;
    }
}

function signInOrCreate() {
    document.getElementById("error-message").innerHTML = "";
    setSignInState(true);
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
        const user = userCredential.user;
        setSignInState(false);
        updateActiveSubscription(() => {
            if (!activeSubscription) {
                subscribe();
            }
        })
    }).catch((_) => {
        createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
            currentUser = userCredential.user;
            setSignInState(false);
            subscribe();
        }).catch((error) => {
            document.getElementById("error-message").innerHTML = firebaseErrorCodeToString(error.code);
            setSignInState(false);
        });
    });
}

function unsubscribe() {
    if (currentUser) {
        deleteDoc(doc(db, "customers", currentUser.uid));
    }
}

async function updateActiveSubscription(callback) {
    onSnapshot(collection(db, "customers", currentUser.uid, "subscriptions"), (snap) => {
        console.log(snap.docs[0])
        if (snap.empty || snap.docs[0].active == false) {
            activeSubscription = false;
        } else {
            activeSubscription = true;
        }
        callback();
    });
}

async function subscribe() {
    console.log("subscribe()");
    await addDoc(collection(db, "customers", currentUser.uid, "checkout_sessions"), {
        price: 'price_1OBhrQCt7GABVsng1OXdxYhs', // price_1OBWbwCt7GABVsngXs9v9SnX
        success_url: window.location.origin,
        cancel_url: window.location.origin,
    });

    onSnapshot(collection(db, "customers", currentUser.uid, "checkout_sessions"), (snap) => {
        const { error, url } = snap.docs[0].data();
        if (error) {
            alert(`An error occured: ${error.message}`);
            console.log(error);
        }
        if (url) {
            window.location.assign(url);
        }
    });
}

function trySignOut() {
    signOut(auth).then(() => {
        console.log("signed out");
    }).catch((error) => {
        console.log(error);
    });
}

async function loadData() {
    if (currentUser) {
        if (!activeSubscription) {
            updateActiveSubscription(() => {
                if (!activeSubscription) {
                    console.log("No active sub")
                    subscribe();
                }
            });
            return;
        }

        const docRef = doc(db, "customers", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            for (let i = 0; i < docSnap.data().timeOffDays.length; i += 1) {
                let date = docSnap.data().timeOffDays[i];
                if (date == '') {
                    continue;
                }
                addTimeoff(date);
            }
            for (let i = 0; i < docSnap.data().holidays.length; i += 1) {
                let date = docSnap.data().holidays[i];
                if (date == '') {
                    continue;
                }
                addHoliday(date);
            }

            document.getElementById(timeoffRateId).value = docSnap.data().timeOffRate;

            hasLoadedData = true;
            console.log("hasLoadedData = true");
            reloadGraph();
        }
    }
}

async function saveData(
    holidays,
    timeOffDays,
    timeOffRate,
) {
    if (currentUser) {
        if (!activeSubscription) {
            updateActiveSubscription(() => {
                if (!activeSubscription) {
                    console.log("No active sub")
                    subscribe();
                }
            });
            return;
        }

        await setDoc(doc(db, "customers", currentUser.uid), {
            "holidays": holidays,
            "timeOffDays": timeOffDays,
            "timeOffRate": timeOffRate,
        }, { merge: true });
    }
}

const version = 2.0;

const MonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const holidayDates = [
    { name: "July 4th 2023", date: new Date(2023, 6, 4) },
    { name: "Labor Day 2023", date: new Date(2023, 8, 4) },
    { name: "Thanksgiving Day 2023", date: new Date(2023, 10, 23) },
    { name: "Thanksgiving Friday 2023", date: new Date(2023, 10, 24) },
    { name: "Christmas Day 2023", date: new Date(2023, 11, 25) },
    { name: "New Year's Day 2024", date: new Date(2024, 0, 1) },
    { name: "Martin Luther King Jr. Day 2024", date: new Date(2024, 0, 15) },
    { name: "Presidents Day 2024", date: new Date(2024, 1, 19) },
    { name: "Memorial Day 2024", date: new Date(2024, 4, 27) },
    { name: "July 4th 2024", date: new Date(2024, 6, 4) },
    { name: "Labor Day 2024", date: new Date(2024, 8, 2) },
    { name: "Thanksgiving Day 2024", date: new Date(2024, 10, 28) },
    { name: "Christmas Day 2024", date: new Date(2024, 11, 25) },
    { name: "New Year's Day 2025", date: new Date(2025, 0, 1) },
    { name: "Martin Luther King Jr. Day 2025", date: new Date(2025, 0, 20) },
    { name: "Presidents Day 2025", date: new Date(2025, 1, 17) },
    { name: "Memorial Day 2025", date: new Date(2025, 4, 26) },
    { name: "July 4th 2025", date: new Date(2025, 6, 4) },
    { name: "Labor Day 2025", date: new Date(2025, 8, 1) },
    { name: "Thanksgiving Day 2025", date: new Date(2025, 10, 27) },
    { name: "Christmas Day 2025", date: new Date(2025, 11, 25) },
    { name: "New Year's Day 2026", date: new Date(2026, 0, 1) },
    { name: "Martin Luther King Jr. Day 2026", date: new Date(2026, 0, 19) },
    { name: "Presidents Day 2026", date: new Date(2026, 1, 16) },
    { name: "Memorial Day 2026", date: new Date(2026, 4, 25) },
    { name: "July 4th 2026", date: new Date(2026, 6, 3) },
    { name: "Labor Day 2026", date: new Date(2026, 8, 7) },
    { name: "Thanksgiving Day 2026", date: new Date(2026, 10, 26) },
    { name: "Christmas Day 2026", date: new Date(2026, 11, 25) },
    { name: "New Year's Day 2027", date: new Date(2027, 0, 1) },
    { name: "Martin Luther King Jr. Day 2027", date: new Date(2027, 0, 18) },
    { name: "Presidents Day 2027", date: new Date(2027, 1, 15) },
    { name: "Memorial Day 2027", date: new Date(2027, 4, 31) },
    { name: "July 4th 2027", date: new Date(2027, 6, 5) },
    { name: "Labor Day 2027", date: new Date(2027, 8, 6) },
    { name: "Thanksgiving Day 2027", date: new Date(2027, 10, 25) },
    { name: "Christmas Day 2027", date: new Date(2027, 11, 25) }
];

const DayMs = 86400000

function DaysBetween(first, second) {
    return Math.round((second.valueOf() - first.valueOf()) / DayMs);
}

// String of dates in ISO format.
let timeOffDays = []

// String of holidays in ISO format.
let holidays = []

const mainChartId = "chart"
const timeoffRateId = "timeoff-rate"

// Value and date represent a reference point for the current balance.
const pinnedBalanceValueId = "pinned-balance-value"
const pinnedBalanceDateId = "pinned-balance-date"

var mainChart = null

function toggleHoliday(date) {
    if (!removeHoliday(date)) {
        addHoliday(date)
    }
    reloadGraph()
}

function toggleDay(date) {
    if (!removeTimeoff(date)) {
        addTimeoff(date)
    }
    reloadGraph()
}

function removeTimeoff(date) {
    const dateEl = document.getElementById(date)
    if (timeOffDays.indexOf(date) !== -1) {
        dateEl.classList.remove("time-off")
        timeOffDays.splice(timeOffDays.indexOf(date), 1)
        return true
    }
    return false
}

function addTimeoff(date) {
    const dateEl = document.getElementById(date)
    if (timeOffDays.indexOf(date) == -1) {
        dateEl.classList.add("time-off")
        timeOffDays.push(date)
        return true
    }
    return false
}

function removeHoliday(date) {
    const holidayEl = document.getElementById(`holiday-${date}`)
    const dayEl = document.getElementById(date)
    if (holidays.indexOf(date) !== -1) {
        dayEl.classList.remove("holiday")
        holidayEl.classList.remove("holidays-button-selected")
        holidays.splice(holidays.indexOf(date), 1)
        return true
    }
    return false
}

function addHoliday(date) {
    const holidayEl = document.getElementById(`holiday-${date}`)
    const dayEl = document.getElementById(date)
    removeTimeoff(date)
    if (holidays.indexOf(date) == -1) {
        dayEl.classList.add("holiday")
        holidayEl.classList.add("holidays-button-selected")
        holidays.push(date)
        return true
    }
    return false
}


async function reloadGraph() {
    console.log("reloadGraph()");
    let thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());

    let ymax = 0
    let ymin = 0

    let labels = []
    let values = []

    let balanceHrs = parseFloat(document.getElementById(pinnedBalanceValueId).value) * 8.0

    let timeoffRateHrsPerTwoWeeks = parseFloat(document.getElementById(timeoffRateId).value) / 365 * 14 * 8

    let days = document.getElementsByClassName("day")
    let twoWeeksPassed = false;
    for (var i = 0; i < days.length; i += 1) {
        let day = days[i]
        let date = new Date(day.id)

        if (date < thisWeek) {
            continue
        }

        if (date.getDay() == 5) { // Friday 
            if (twoWeeksPassed) {
                balanceHrs += timeoffRateHrsPerTwoWeeks
                twoWeeksPassed = false;
            } else {
                twoWeeksPassed = true;
            }
        }

        if (timeOffDays.indexOf(day.id) !== -1) {
            balanceHrs -= 8.0
        }

        let balanceDays = balanceHrs / 8.0
        if (balanceDays > ymax) {
            ymax = balanceDays
        }

        if (balanceDays < ymin) {
            ymin = balanceDays
        }

        if (date.getDay() == 0) {
            labels.push(`${date.toDateString()}`)
            values.push(`${balanceDays}`)
        }
    }

    if (mainChart == null) {
        mainChart = new Chart(document.getElementById(mainChartId).getContext("2d"), {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    fill: true,
                    lineTension: 0,
                    pointBackgroundColor: "#55bae7",
                    pointBorderColor: "#55bae7",
                    pointHoverBackgroundColor: "#55bae7",
                    pointHoverBorderColor: "#55bae7",
                    data: values
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                elements: { point: { radius: 2, hoverRadius: 4, } },
                scales: {
                    x: {
                        ticks: { major: { enabled: true } }
                    },
                    y: {
                        suggestedMin: 0,
                        suggestedMax: 5,
                    },
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: "Days Off Balance",
                        font: {
                            size: 16,
                            color: '#1c1e21',
                            weight: 'normal',
                        },
                    }
                },
            },
        });
    } else {
        mainChart.data.datasets.forEach((dataset) => {
            dataset.data = []
        });

        mainChart.data.datasets.forEach((dataset) => {
            for (i = 0; i < values.length; i += 1) {
                dataset.data.push(values[i]);
            }
        });
        mainChart.update();
    }

    if (hasLoadedData) {
        saveData(
            holidays,
            timeOffDays,
            document.getElementById(timeoffRateId).value,
        );
    }
}

function toggleHolidayList() {
    var div = document.getElementById(`holidays-content-div-id`)
    if (div.style.display == "none") {
        div.style.display = "block"
    } else {
        div.style.display = "none"
    }
}

async function start() {
    var startDay = new Date();
    var endDay = new Date();
    endDay.setFullYear(startDay.getFullYear() + 1);
    for (var i = 0; i < holidayDates.length; i++) {
        if (holidayDates[i].date < startDay || holidayDates[i].date > endDay) {
            continue
        }

        var parent = document.getElementById("holidays-content-div-id");
        var div = document.createElement("div");
        var iso = holidayDates[i].date.toISOString().split("T")[0];
        div.id = `holiday-${iso}`;
        div.className = "holidays-button-div";
        div.onclick = function () { toggleHoliday(this.id.replace("holiday-", "")) };
        div.innerHTML = holidayDates[i].name;
        parent.appendChild(div);
    }

    var lastMonth = -1;
    var annualDay = new Date();
    annualDay.setDate(1);
    while (true) {
        if (annualDay > endDay) {
            break
        }
        lastMonth = annualDay.getMonth();

        var parent = document.getElementById("annual-div-id");
        var monthDiv = document.createElement("div");
        monthDiv.className = "month-div";
        var monthNameDiv = document.createElement("div");
        monthNameDiv.className = "month-name-div";
        monthNameDiv.innerHTML = `${MonthNames[annualDay.getMonth()]} ${annualDay.getFullYear()}`;
        monthDiv.appendChild(monthNameDiv);

        var monthOl = document.createElement("ol");
        monthOl.className = "month-ol";
        for (var weekday = 0; weekday < 7; weekday++) {
            var weekdayLi = document.createElement("li");
            weekdayLi.className = "day-name";
            weekdayLi.innerHTML = `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday]}`;
            monthOl.appendChild(weekdayLi);
        }
        monthDiv.appendChild(monthOl);

        for (var monthDayI = 0; monthDayI < [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][annualDay.getMonth()]; monthDayI++) {
            var monthDay = new Date(annualDay.getTime()); monthDay.setDate(monthDayI + 1)

            var monthDayIso = new Date(monthDay.getTime()); monthDayIso.setDate(monthDay.getDate() - 1)

            var monthDayLi = document.createElement("li");
            monthDayLi.id = monthDayIso.toISOString().split("T")[0]
            monthDayLi.className = "day";
            monthDayLi.onclick = function () { toggleDay(this.id) };
            monthDayLi.style = `grid-column-start: ${monthDay.getDay() + 1}`
            monthDayLi.innerHTML = `${monthDay.getDate()}`;

            if (monthDay < startDay) {
                monthDayLi.classList.add("past")
            }

            monthOl.appendChild(monthDayLi);
        }

        parent.appendChild(monthDiv);
        annualDay.setMonth(annualDay.getMonth() + 1);
    }

    reloadGraph();
}

Chart.defaults.color = '#000';
window.onload = start;
console.log("")
console.log("             -------------")
console.log("             |   | x |   |")
console.log("             -------------")
console.log("             |   |   | x |")
console.log("             -------------")
console.log("             | x | x | x |")
console.log("             -------------")
console.log("      https://gannonbarnett.com/")
console.log("")
console.log(`      Days Off Planner v${version}`)