from flask import Flask, session, render_template

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
  "New Year's Day": 0,
  "Jan 2": 1,
  "MLK Day": 14,
  "July 4th": 184,
  "Labor Day": 243,
  "Veteran's Day": 214,
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
    timeOff=[]) 

if __name__ == "__main__":
  app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
