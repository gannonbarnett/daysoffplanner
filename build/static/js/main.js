const holidays = [];

const unit = 8.0;
var months = [
  {"name": "January","i":0},
  {"name": "Febuary","i":31},
  {"name": "March","i":59},
  {"name": "April","i":90},
  {"name": "May","i":120},
  {"name": "June","i":151},
  {"name": "July","i":181},
  {"name": "August","i":212},
  {"name": "September","i":243},
  {"name": "October","i":273},
  {"name": "November","i":304},
  {"name": "December","i":334},
]

const mainChartId = "chart";
const startingBalanceId = "starting-balance";
const timeoffRateId = "timeoff-rate";

var mainChart = null;

function toggleHoliday(i) {
  if (!removeHoliday(i)) {
    addHoliday(i)
  }
  reloadGraph()
} 

function toggleDay(i) {
  if (!removeTimeoff(i)) {
    addTimeoff(i)
  }
  reloadGraph()
} 

function removeTimeoff(i) {
  const d = document.getElementById(i);
  if (timeOffDays.includes(i)) {
    d.classList.remove("time-off"); 
    timeOffDays.splice(timeOffDays.indexOf(i), 1);
    return true
  }
  return false
}

function addTimeoff(i) {
  const d = document.getElementById(i);
  if (!timeOffDays.includes(i)) {
    d.classList.add("time-off"); 
    timeOffDays.push(i)
    return true
  }
  return false
}

function removeHoliday(i) {
  const holiday = document.getElementById(`holiday-${i}`);
  const day = document.getElementById(i);
  if (holidays.includes(i)) {
    day.classList.remove("holiday"); 
    holiday.classList.remove("holidays-button-selected");
    holidays.splice(holidays.indexOf(i), 1);
    return true
  }
  return false
}

function addHoliday(i) {
  const holiday = document.getElementById(`holiday-${i}`);
  const day = document.getElementById(i);
  removeTimeoff(i);
  if (!holidays.includes(i)) {
    day.classList.add("holiday"); 
    holiday.classList.add("holidays-button-selected");
    holidays.push(i)
    return true
  }
  return false
}

// Cookies
function createCookie(name, value, days) {
  var expires;
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
  }
  else {
      expires = "";
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
  if (document.cookie.length > 0) {
      c_start = document.cookie.indexOf(c_name + "=");
      if (c_start != -1) {
          c_start = c_start + c_name.length + 1;
          c_end = document.cookie.indexOf(";", c_start);
          if (c_end == -1) {
              c_end = document.cookie.length;
          }
          return unescape(document.cookie.substring(c_start, c_end));
      }
  }
  return "";
}

const timeOffCookieKey = "timeOffDays";
const holidaysCookieKey = "holidays";

let timeOffDays = [];

function reloadGraph() {
  var max = 0;
  var min = 0;

  var labels = []
  var values = []
  var balance = document.getElementById(startingBalanceId).valueAsNumber / 8.0;
  var timeoffRate = document.getElementById(timeoffRateId).valueAsNumber;
  
  var currMonthI = 0;
  for (i=0;i<365;i+=1) {
    if (i % 14 == 0) {
      balance += timeoffRate / unit
    }
    if (timeOffDays.includes(i)) {
      balance -= 8.0 / unit
    }

    if (balance > max) {
      max = balance
    }
    if (balance < min) {
      min = balance
    }

    // Start of new month
    if (currMonthI+1 < months.length && i == months[currMonthI+1].i) {
      currMonthI += 1
    } 

    // Record at start of each week 
    if (i%7 == 0) {
      labels.push(`${currMonthI + 1}/${i-months[currMonthI].i+1}`)
      values.push(balance)
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
          data: values}]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {point:{radius: 2, hoverRadius: 4,}},
        scales: {
          x: {
            ticks: {major: {enabled: true}}
          },
          y: {
          },
        },
        plugins: {
          legend:{display:false},
          title: {
            display: true, 
            text: "Time Off Balance (days)",
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
      for (i=0;i<59;i+=1) {
        dataset.data.pop();
      }
    });
    mainChart.data.datasets.forEach((dataset) => {
      for (i=0;i<59;i+=1) {
        dataset.data.push(values[i]);
      }
    });
    mainChart.update();
  }

  createCookie(timeOffCookieKey, timeOffDays.join("|"))
  createCookie(holidaysCookieKey, holidays.join("|"))
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
  for (i=0;i< timeOffFromCookie.length; i+=1){
    if (timeOffFromCookie[i] == '') {
      continue
    }
    addTimeoff(Number(timeOffFromCookie[i]))
  }
  let holidaysFromCookie = getCookie(holidaysCookieKey).split("|");
  for (i=0;i< holidaysFromCookie.length; i+=1){
    if (holidaysFromCookie[i] == '') {
      continue
    }
    addHoliday(Number(holidaysFromCookie[i]))
  }
  reloadGraph()
}

Chart.defaults.color = '#000';
window.onload = loadFromCookies