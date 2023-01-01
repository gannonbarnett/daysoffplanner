from flask import Flask, session, render_template
from datetime import datetime, timedelta

def get_today_index_of_year():
    today = datetime.today()
    start = datetime(today.year, 1, 1)
    diff = today - start
    return diff.days

app = Flask(__name__)
start_day_2022 = 0
months={
  "January": 31,
  "Febuary": 59,
  "March": 90,
  "April": 120,
  "May":151,
  "June":181,
  "July":212,
  "August":243,
  "September":273,
  "October":304,
  "November":334,
  "December":365,
}

holidays={
  "New Year's": 0,
  "New Year's +1": 1,
  "MLK Day": 15,
  "Presidents' Day": 50,
  "Memorial Day": 148,
  "July 4th": 184,
  "July 4th +1": 185,
  "Labor Day": 246,
  "Columbus Day": 281,
  "Veterans Day": 313,
  "Thanksgiving -1": 325,
  "Thanksgiving Day": 326,
  "Thanksgiving +1": 327,
  "Christmas Eve": 357,
  "Christmas": 358,
}

@app.route("/")
def index():
    return render_template("annual.html", 
    annualStartDay=0,
    year=2023,
    months=months,
    holidays=holidays,
    todayIndex=get_today_index_of_year()) 

if __name__ == "__main__":
  app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
