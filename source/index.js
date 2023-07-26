const MonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

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

const timeOffCookieKey = "timeOffDays"
const holidaysCookieKey = "holidays"
const timeOffRateCookieKey = "timeOffRate"


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

// Cookies
function createCookie(name, value) {
  var later = new Date(); later.setFullYear(later.getFullYear() + 10)
  document.cookie = `${name}=${value}; expires=${later.toUTCString()}; path=/`
  console.log(`${name}=${value}; expires=${later.toUTCString()}; path=/`)
}

function getCookie(name) {
  if (document.cookie.length > 0) {
    var start = document.cookie.indexOf(name + "=")
    var end = document.cookie.length
    if (start != -1) {
      start = start + name.length + 1
      end = document.cookie.indexOf(";", start)
      if (end != -1) {
        return document.cookie.substring(start, end)
      }
      return document.cookie.substring(start, document.cookie.length)
    }
  }
  return "";
}

function reloadGraph() {
  let ymax = 0
  let ymin = 0

  let labels = []
  let values = []

  let balanceHrs = parseFloat(document.getElementById(pinnedBalanceValueId).value)

  let timeoffRateHrs = parseFloat(document.getElementById(timeoffRateId).value) * 8 / 26 

  let days = document.getElementsByClassName("day")
  let twoWeeksPassed = false;
  for (var i = 0; i < days.length; i += 1) {
    let day = days[i]
    let date = new Date(day.id)

    if (date.getDay() == 5) { // Friday 
      if (twoWeeksPassed) {
        balanceHrs += timeoffRateHrs
        twoWeeksPassed = false;
      } else {
        twoWeeksPassed = true;
      }
    }

    if (timeOffDays.indexOf(day.id) !== -1) {
      balanceHrs -= 8.0
    }

    balanceDays = balanceHrs / 8.0
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

  createCookie(timeOffCookieKey, timeOffDays.join("|"))
  createCookie(holidaysCookieKey, holidays.join("|"))
  createCookie(pinnedBalanceValueId, document.getElementById(pinnedBalanceValueId).value)
  createCookie(timeOffRateCookieKey, document.getElementById(timeoffRateId).value)
  createCookie("days-off-planner-version", "1.1")
}

function toggleHolidayList() {
  var div = document.getElementById(`holidays-content-div-id`)
  if (div.style.display == "none") {
    div.style.display = "block"
  } else {
    div.style.display = "none"
  }
}

function start() {
  var now = new Date();
  document.getElementById("year-span").innerHTML = now.getFullYear();

  var startDay = new Date();
  startDay.setDate(1);
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
    div.onclick = function() { toggleHoliday(this.id.replace("holiday-", "")) };
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
    for (var weekday = 0; weekday < 7; weekday ++) {
      var weekdayLi = document.createElement("li");
      weekdayLi.className = "day-name";
      weekdayLi.innerHTML = `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday]}`;
      monthOl.appendChild(weekdayLi);
    }
    monthDiv.appendChild(monthOl);

    for (var monthDayI = 0; monthDayI < [31,28,31,30,31,30,31,31,30,31,30,31][annualDay.getMonth()]; monthDayI ++) {
      var monthDay = new Date(annualDay.getTime()); monthDay.setDate(monthDayI+1)

      var monthDayIso = new Date(monthDay.getTime()); monthDayIso.setDate(monthDay.getDate()-1)

      var monthDayLi = document.createElement("li");
      monthDayLi.id = monthDayIso.toISOString().split("T")[0]  
      monthDayLi.className = "day";
      monthDayLi.onclick = function() { toggleDay(this.id) };
      monthDayLi.style = `grid-column-start: ${monthDay.getDay() + 1}`
      monthDayLi.innerHTML = `${monthDay.getDate()}`;

      if (monthDay < now) {
        monthDayLi.classList.add("past")
      }

      monthOl.appendChild(monthDayLi);
    }

    parent.appendChild(monthDiv);
    annualDay.setMonth(annualDay.getMonth() + 1);
  }

  let timeOffFromCookie = getCookie(timeOffCookieKey).split("|");
  for (let i = 0; i < timeOffFromCookie.length; i += 1) {
    if (timeOffFromCookie[i] == '') {
      continue
    }
    addTimeoff(timeOffFromCookie[i])
  }
  let holidaysFromCookie = getCookie(holidaysCookieKey).split("|");
  for (let i = 0; i < holidaysFromCookie.length; i += 1) {
    if (holidaysFromCookie[i] == '') {
      continue
    }
    addHoliday(holidaysFromCookie[i])
  }

  let pinnedDateIso = getCookie(pinnedBalanceDateId);
  let pinnedDate = new Date(pinnedDateIso);
  if (pinnedDateIso == "") {
    createCookie(pinnedBalanceDateId, new Date().toISOString().split("T")[0]);
    
    // TODO: Cookies don't work when loading site from file, so not loading from cookie here.
    pinnedDate = new Date(); 
  }

  let pinnedValue = Number(getCookie(pinnedBalanceValueId));
  if (isNaN(pinnedValue)) {
    // If there's no cookie, use site default.
    pinnedValue = document.getElementById(pinnedBalanceValueId).value;
  }

  let timeOffRate = parseFloat(getCookie(timeOffRateCookieKey))
  if (isNaN(timeOffRate)) {
    timeOffRate = document.getElementById(timeoffRateId).value/365.0;
    createCookie(timeOffRateCookieKey, timeOffRate);
  }
  document.getElementById(pinnedBalanceValueId).value = DaysBetween(pinnedDate, new Date()) * timeOffRate + pinnedValue;

  reloadGraph();
}

function currentBalanceChanged() {
  createCookie(pinnedBalanceDateId, new Date().toISOString().split("T")[0]);
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


