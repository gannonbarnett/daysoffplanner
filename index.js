import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js'
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js'
import { 
    createUserWithEmailAndPassword,
    deleteUser,
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js'
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    setDoc,
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js'

function formatDate(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

document.getElementById("password").addEventListener("keypress", function (event) {
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
var sentPasswordResetEmail = false;

function showLoadingOverlay() {
    document.getElementById("loading-div").style.display = "block";
}

function removeLoadingOverlay() {
    document.getElementById("loading-div").style.display = "none";
}

function hideSubscription() {
    [...document.getElementsByClassName("hide-logged-in")].forEach(el => {
        el.style.display = "none";
    });
    [...document.getElementsByClassName("hide-logged-out")].forEach(el => {
        el.style.display = "inherit";
    });
    document.getElementById("container").style.marginLeft = "0%";
    document.getElementById("container").style.width = "100%";
}

function showSubscription() {
    [...document.getElementsByClassName("hide-logged-in")].forEach(el => {
        el.style.display = "inherit";
    });
    [...document.getElementsByClassName("hide-logged-out")].forEach(el => {
        el.style.display = "none";
    });
    document.getElementById("container").style.marginLeft = "25%";
    document.getElementById("container").style.width = "75%";
}

onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged()");
    currentUser = user;
    document.getElementById("signInOrCreate").onclick = signInOrCreate;
    document.getElementById("sign-out-button").onclick = trySignOut;
    document.getElementById("unsubscribe-confirm").onclick = unsubscribe;
    if (user) {
        console.log("signed in");
        showLoadingOverlay();
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('cancel') == "true") {
            deleteDoc(doc(db, "customers", currentUser.uid));
            deleteUser(user).then(() => {
                console.log("deleted user");
                window.location.href = window.location.origin;
            }).catch((error) => {
                console.log(error);
                window.location.href = window.location.origin;
            });
        }

        hideSubscription();
        await loadData();
    } else {
        removeLoadingOverlay();

        // Don't show the subscription on mobile (yet).
        if (window.innerWidth > 800) {
            showSubscription();
        } else {
            hideSubscription();
        }
    }
});

function setSignInLoading(loading) {
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
    setSignInLoading(true);
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
        setSignInLoading(false);
    }).catch((_) => {
        createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
            currentUser = userCredential.user;
            setSignInLoading(false);
        }).catch((error) => {
            document.getElementById("error-message").innerHTML = firebaseErrorCodeToString(error.code);
            setSignInLoading(false);
        });
    });
}

function unsubscribe() {
    if (currentUser) {
        deleteDoc(doc(db, "customers", currentUser.uid));
        deleteUser(currentUser).then(() => {
            console.log("deleted user");
            window.location.href = window.location.origin;
        }).catch((error) => {
            console.log(error);
            trySignOut();
            window.location.href = window.location.origin;
        });
    }
}

function trySignOut() {
    signOut(auth).then(() => {
        console.log("signed out");
    }).catch((error) => {
        console.log(error);
    });
}

async function loadData() {
    if (currentUser == undefined) {
        return
    }

    var subscribed = false;
    const querySnapshot = await getDocs(collection(db, "customers", currentUser.uid, "subscriptions"));
    querySnapshot.forEach((doc) => {
        if (doc.data().status == "active") {
            subscribed = true;
        }
    });

    if (!subscribed) {
        console.log("subscribing");

        // Add a new doc to "checkout_sessions", which Stripe listens for.
        addDoc(collection(db, "customers", currentUser.uid, "checkout_sessions"), {
            price: 'price_1OG76NCt7GABVsngmThHE0ux', // $5
            success_url: window.location.origin,
            cancel_url: window.location.origin + "?cancel=true",
        });

        // Wait for stripe to add more info to the doc.
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

        // If the user isn't subscribed, they'll be redirected to stripe and back. loadData will be called again.
        return
    }

    const docRef = doc(db, "customers", currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        if (docSnap.data().timeOffDays) {
            for (let i = 0; i < docSnap.data().timeOffDays.length; i += 1) {
                let date = docSnap.data().timeOffDays[i];
                if (date == '') {
                    continue;
                }
                addTimeoff(date);
            }
        }
        
        if (docSnap.data().holidays) {
            for (let i = 0; i < docSnap.data().holidays.length; i += 1) {
                let date = docSnap.data().holidays[i];
                if (date == '') {
                    continue;
                }
                addHoliday(date);
            }
        }

        document.getElementById(timeoffRateId).value = docSnap.data().timeOffRate;

        if (docSnap.data().pinnedBalance !== undefined && docSnap.data().pinnedBalanceDate !== undefined) {
            const daysSincePin = Number(DaysBetween(docSnap.data().pinnedBalanceDate.toDate(), new Date()));
            const valueAtPin = Number(docSnap.data().pinnedBalance);
            const vacaPerDay = Number(docSnap.data().timeOffRate) / 365.0;
            const currBalance = Number(valueAtPin + (vacaPerDay * daysSincePin));

            document.getElementById(pinnedBalanceValueId).value = Math.round(currBalance * 10) / 10;
        } else {
            document.getElementById(pinnedBalanceValueId).value = 0;
        }

        // Update to current pin.
        pinnedBalanceDate = new Date();
    }

    reloadGraph();
    console.log("removeLoadingOverlay");
    removeLoadingOverlay();
}

async function saveData(
    holidays,
    timeOffDays,
    timeOffRate,
    pinnedBalance,
    pinnedBalanceDate,
) {
    if (currentUser == undefined) {
        return;
    }

    await setDoc(doc(db, "customers", currentUser.uid), {
        "holidays": holidays,
        "timeOffDays": timeOffDays,
        "timeOffRate": timeOffRate,
        "pinnedBalance": pinnedBalance,
        "pinnedBalanceDate": pinnedBalanceDate,
    }, { merge: true });
}

var pinnedBalanceDate = new Date();

const version = 2.3;

const MonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const holidayDates = [
    { name: "Thanksgiving Day 2023", date: new Date(2023, 10, 23), companies: ["SpaceX", "Amazon"] },
    { name: "Thanksgiving Friday 2023", date: new Date(2023, 10, 24), companies: ["SpaceX", "Google"] },
    { name: "Christmas Eve (12/22) 2023", date: new Date(2023, 11, 22), companies: ["Google"] },
    { name: "Christmas Day 2023", date: new Date(2023, 11, 25), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "New Year's Eve (12/29) 2023", date: new Date(2023, 11, 29), companies: ["Google"] },
    { name: "New Year's Day 2024", date: new Date(2024, 0, 1), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "Martin Luther King Jr. Day 2024", date: new Date(2024, 0, 15), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "Presidents Day 2024", date: new Date(2024, 1, 19), companies: ["Google"] },
    { name: "Memorial Day 2024", date: new Date(2024, 4, 27), companies: ["SpaceX", "Amazon"] },
    { name: "Juneteenth 2024", date: new Date(2024, 5, 19), companies: ["Google"] },
    { name: "July 4th 2024", date: new Date(2024, 6, 4), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "July 5th 2024", date: new Date(2024, 6, 5), companies: ["SpaceX", "Google"] },
    { name: "Labor Day 2024", date: new Date(2024, 8, 2), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "Veterans' Day 2024", date: new Date(2024, 10, 10), companies: ["SpaceX"] },
    { name: "Thanksgiving Day 2024", date: new Date(2024, 10, 28), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "Thanksgiving Friday 2024", date: new Date(2024, 10, 29), companies: ["SpaceX", "Google"] },
    { name: "Christmas Eve 2024", date: new Date(2024, 11, 24), companies: ["SpaceX", "Google"] },
    { name: "Christmas Day 2024", date: new Date(2024, 11, 25), companies: ["SpaceX", "Google", "Amazon"] },
    { name: "New Year's Day 2025", date: new Date(2025, 0, 1), companies: ["SpaceX", "Google"] },
    { name: "Martin Luther King Jr. Day 2025", date: new Date(2025, 0, 20), companies: ["SpaceX"] },
    { name: "Presidents Day 2025", date: new Date(2025, 1, 17), companies: ["SpaceX"] },
    { name: "Memorial Day 2025", date: new Date(2025, 4, 26), companies: ["SpaceX"] },
    { name: "July 4th 2025", date: new Date(2025, 6, 4), companies: ["SpaceX"] },
    { name: "Labor Day 2025", date: new Date(2025, 8, 1), companies: ["SpaceX"] },
    { name: "Thanksgiving Day 2025", date: new Date(2025, 10, 27), companies: ["SpaceX"] },
    { name: "Christmas Day 2025", date: new Date(2025, 11, 25), companies: ["SpaceX"] },
    { name: "New Year's Day 2026", date: new Date(2026, 0, 1), companies: ["SpaceX"] },
    { name: "Martin Luther King Jr. Day 2026", date: new Date(2026, 0, 19), companies: ["SpaceX"] },
    { name: "Presidents Day 2026", date: new Date(2026, 1, 16), companies: ["SpaceX"] },
    { name: "Memorial Day 2026", date: new Date(2026, 4, 25), companies: ["SpaceX"] },
    { name: "July 4th 2026", date: new Date(2026, 6, 3), companies: ["SpaceX"] },
    { name: "Labor Day 2026", date: new Date(2026, 8, 7), companies: ["SpaceX"] },
    { name: "Thanksgiving Day 2026", date: new Date(2026, 10, 26), companies: ["SpaceX"] },
    { name: "Christmas Day 2026", date: new Date(2026, 11, 25), companies: ["SpaceX"] },
    { name: "New Year's Day 2027", date: new Date(2027, 0, 1), companies: ["SpaceX"] },
    { name: "Martin Luther King Jr. Day 2027", date: new Date(2027, 0, 18), companies: ["SpaceX"] },
    { name: "Presidents Day 2027", date: new Date(2027, 1, 15), companies: ["SpaceX"] },
    { name: "Memorial Day 2027", date: new Date(2027, 4, 31), companies: ["SpaceX"] },
    { name: "July 4th 2027", date: new Date(2027, 6, 5), companies: ["SpaceX"] },
    { name: "Labor Day 2027", date: new Date(2027, 8, 6), companies: ["SpaceX"] },
    { name: "Thanksgiving Day 2027", date: new Date(2027, 10, 25), companies: ["SpaceX"] },
    { name: "Christmas Day 2027", date: new Date(2027, 11, 25), companies: ["SpaceX"] }
];

const supportedCompanies = [
    "SpaceX",
    "Amazon",
    "Google",
];

const DayMs = 86400000

function DaysBetween(first, second) {
    return Math.round((second.valueOf() - first.valueOf()) / DayMs);
}

async function setCompany(company) {
    for (var i = 0; i < holidayDates.length; i++) {
        removeHoliday(formatDate(holidayDates[i].date));
        if (holidayDates[i].companies.indexOf(company) !== -1) {
            addHoliday(formatDate(holidayDates[i].date));
        }
    }
    await reloadGraph();
}

let timeOffDays = []

let holidays = []

const mainChartId = "chart"
const timeoffRateId = "timeoff-rate"

const pinnedBalanceValueId = "pinned-balance-value"

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
    const dateEl = document.getElementById(date);
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
    var newHoliday = false;
    if (holidays.indexOf(date) !== -1) {
        // It's possible that this day, or holiday is not shown in the UI.
        if (dayEl != null) {
            dayEl.classList.remove("holiday")
        }
        if (holidayEl != null) {
            holidayEl.classList.remove("holidays-button-selected")
        }

        holidays.splice(holidays.indexOf(date), 1)
        newHoliday = true;
    }
    updateCompanyCheckmarks();
    return newHoliday;
}

function addHoliday(date) {
    const holidayEl = document.getElementById(`holiday-${date}`)
    const dayEl = document.getElementById(date)
    removeTimeoff(date)
    var newHoliday = false;
    if (holidays.indexOf(date) == -1) {
        // It's possible that this day, or holiday is not shown in the UI.
        if (dayEl != null) {
            dayEl.classList.add("holiday")
        }
        if (holidayEl != null) {
            holidayEl.classList.add("holidays-button-selected")
        }

        holidays.push(date)
        newHoliday = true;
    }

    updateCompanyCheckmarks();
    return newHoliday
}

function updateCompanyCheckmarks() {
    // Add checkmarks if the user has all holidays of the company selected.
    for (var i = 0; i < supportedCompanies.length; i++) {
        for (var j = 0; j < holidayDates.length; j++) {
            if (holidayDates[j].companies.indexOf(supportedCompanies[i]) !== -1) {
                if (holidays.indexOf(formatDate(holidayDates[j].date)) == -1) {
                    break
                }
            }
        }

        if (j == holidayDates.length) {
            document.getElementById(`company-${supportedCompanies[i]}`).innerHTML = `${supportedCompanies[i]} &#10003;`;
        } else {
            document.getElementById(`company-${supportedCompanies[i]}`).innerHTML = `${supportedCompanies[i]}`;
        }
    }
}

async function reloadGraph() {
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

    await saveData(
        holidays,
        timeOffDays,
        document.getElementById(timeoffRateId).value,
        document.getElementById(pinnedBalanceValueId).value,
        pinnedBalanceDate,
    );
}

function toggleHolidayList() {
    var div = document.getElementById(`holidays-content-div-id`)
    if (div.style.display == "none") {
        div.style.display = "block"
    } else {
        div.style.display = "none"
    }
}

function pinnedBalanceChanged() {
    pinnedBalanceDate = new Date();
    reloadGraph();
}

function resetPassword() {
    if (sentPasswordResetEmail || document.getElementById("email").value == "") {
        return
    }
    sendPasswordResetEmail(auth, document.getElementById("email").value)
    .then(() => {
        sentPasswordResetEmail = true;
        document.getElementById("reset-password").innerHTML = "Email sent";
        console.log("password reset email sent");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
}

async function start() {

    document.getElementById("timeoff-rate").onchange = reloadGraph;
    document.getElementById("pinned-balance-value").onchange = pinnedBalanceChanged;

    document.getElementById("reset-password").onclick = resetPassword;

    var startDay = new Date();
    var endDay = new Date();
    endDay.setFullYear(startDay.getFullYear() + 1);
    for (var i = 0; i < holidayDates.length; i++) {
        if (holidayDates[i].date < startDay || holidayDates[i].date > endDay) {
            continue
        }

        // var parent = document.getElementById("holidays-content-div-id");
        var parent = document.getElementById("holidays-specific-content-div-id");
        var div = document.createElement("div");
        var iso = formatDate(holidayDates[i].date);
        div.id = `holiday-${iso}`;
        div.className = "holidays-button-div";
        div.onclick = function () { toggleHoliday(this.id.replace("holiday-", "")) };
        div.innerHTML = holidayDates[i].name;
        parent.appendChild(div);
    }

    var div = document.createElement("div");
    div.className = "company-separator";
    document.getElementById("holidays-content-div-id").appendChild(div);

    for (var i = 0; i < supportedCompanies.length; i ++) {
        var div = document.createElement("div");
        div.className = "company-button-div";
        div.id = `company-${supportedCompanies[i]}`;
        div.onclick = async function () { await setCompany(this.id.replace("company-", "")) };
        div.innerHTML = supportedCompanies[i];
        document.getElementById("holidays-content-div-id").appendChild(div);
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

            var monthDayIso = new Date(monthDay.getTime()); monthDayIso.setDate(monthDay.getDate())

            var monthDayLi = document.createElement("li");
            monthDayLi.id = formatDate(monthDayIso);
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