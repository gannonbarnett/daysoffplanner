const DayMs = 86400000

// String of dates in ISO format.
let timeOffDays = [] 

// String of holidays in ISO format.
let holidays = []

const mainChartId = "chart"
const startingBalanceId = "starting-balance"
const timeoffRateId = "timeoff-rate"

const timeOffCookieKey = "timeOffDays"
const holidaysCookieKey = "holidays"
const timeOffRateCookieKey = "timeOffRate"
const startingBalanceCookieKey = "startingBalance"


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
  const holidayEl = document.getElementById(`holiday-${date}`);
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
function createCookie(name, value, days) {
  var now = new Date()
  document.cookie = `${name}=${value}; expires=${(new Date()).setFullYear(now.getFullYear() + 1)}; path=/`
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
  let balanceHrs = parseFloat(document.getElementById(startingBalanceId).value) * 8
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
    // Reset all the datapoints.
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

  createCookie(timeOffCookieKey, timeOffDays.join("|"), 365)
  createCookie(holidaysCookieKey, holidays.join("|"), 365)
  createCookie(startingBalanceCookieKey, document.getElementById(startingBalanceId).value, 365)
  createCookie(timeOffRateCookieKey, document.getElementById(timeoffRateId).value, 365)
  createCookie("days-off-planner-version", "1.0", 365)
}

function toggleHolidayList() {
  var div = document.getElementById(`holidays-content-div-id`)
  if (div.style.display == "none") {
    div.style.display = "block"
  } else {
    div.style.display = "none"
  }
}


function loadFromCookies() {
  // Load from cookies.
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

  document.getElementById(startingBalanceId).value = Number(getCookie(startingBalanceCookieKey))
  let timeOffRateFromCookie = Number(getCookie(timeOffRateCookieKey));
  if (timeOffRateFromCookie == 0.0) {
    timeOffRateFromCookie = 4.5 // Default rate is 4.5
  }
  document.getElementById(timeoffRateId).value = timeOffRateFromCookie

  reloadGraph()
}

Chart.defaults.color = '#000';
window.onload = loadFromCookies;
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