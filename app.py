from flask import Flask, session, render_template
from datetime import datetime, timedelta
import os

def new_date(d: datetime):
  return {
    "iso": d.strftime("%Y-%m-%d"),  
    "weekday": (d.weekday()-6)%7+1,
    "monthday": d.day,
  }

def build_months(start_range: datetime, end_range: datetime): 
  months = [] 
  current_date = start_range.replace(day=1)
  curr_month = {
    "name": current_date.strftime("%B"),
    "year": current_date.year,
    "days": []
  }
  while True:
    month_name = current_date.strftime("%B")
    if month_name != curr_month["name"]:
      months.append(curr_month)
      curr_month = {
        "name": current_date.strftime("%B"),
        "year": current_date.year,
        "days": []
      }
      if current_date > end_range:
        break
    
    curr_month["days"].append(new_date(current_date))
    current_date = current_date + timedelta(days=1)

  return months


app = Flask(__name__)

holidays = {
  "July 3rd 2023": new_date(datetime(2023, 7, 3)),
  "July 4th 2023": new_date(datetime(2023, 7, 4)),
  "Labor Day 2023": new_date(datetime(2023, 9, 4)),
  "Thanksgiving Day 2023": new_date(datetime(2023, 11, 23)),
  "Christmas Day 2023": new_date(datetime(2023, 12, 25)),
  "New Year's Day 2024": new_date(datetime(2024, 1, 1)),
  "Easter 2024": new_date(datetime(2024, 4, 8)),
  "Memorial Day 2024": new_date(datetime(2024, 5, 27)),
  "July 3rd 2024": new_date(datetime(2024, 7, 3)),
  "July 4th 2024": new_date(datetime(2024, 7, 4)),
  "Labor Day 2024": new_date(datetime(2024, 9, 2)),
  "Thanksgiving Day 2024": new_date(datetime(2024, 11, 28)),
  "Christmas Day 2024": new_date(datetime(2024, 12, 25)),
  "New Year's Day 2025": new_date(datetime(2025, 1, 1)),
  "Easter 2025": new_date(datetime(2025, 3, 30)),
  "Memorial Day 2025": new_date(datetime(2025, 5, 26)),
  "July 3rd 2025": new_date(datetime(2025, 7, 3)),
  "July 4th 2025": new_date(datetime(2025, 7, 4)),
  "Labor Day 2025": new_date(datetime(2025, 9, 1)),
  "Thanksgiving Day 2025": new_date(datetime(2025, 11, 27)),
  "Christmas Day 2025": new_date(datetime(2025, 12, 25)),
  "New Year's Day 2026": new_date(datetime(2026, 1, 1)),
  "Easter 2026": new_date(datetime(2026, 4, 19)),
  "Memorial Day 2026": new_date(datetime(2026, 5, 25)),
  "July 3rd 2026": new_date(datetime(2026, 7, 3)),
  "July 4th 2026": new_date(datetime(2026, 7, 4)),
  "Labor Day 2026": new_date(datetime(2026, 9, 7)),
  "Thanksgiving Day 2026": new_date(datetime(2026, 11, 26)),
  "Christmas Day 2026": new_date(datetime(2026, 12, 25)),
  "New Year's Day 2027": new_date(datetime(2027, 1, 1)),
  "Easter 2027": new_date(datetime(2027, 4, 11)),
  "Memorial Day 2027": new_date(datetime(2027, 5, 31)),
  "July 3rd 2027": new_date(datetime(2027, 7, 3)),
  "July 4th 2027": new_date(datetime(2027, 7, 4)),
  "Labor Day 2027": new_date(datetime(2027, 9, 6)),
  "Thanksgiving Day 2027": new_date(datetime(2027, 11, 25)),
  "Christmas Day 2027": new_date(datetime(2027, 12, 25)),
  "New Year's Day 2028": new_date(datetime(2028, 1, 1)),
  "Easter 2028": new_date(datetime(2028, 3, 31)),
  "Memorial Day 2028": new_date(datetime(2028, 5, 29)),
  "July 3rd 2028": new_date(datetime(2028, 7, 3)),
  "July 4th 2028": new_date(datetime(2028, 7, 4)),
  "Labor Day 2028": new_date(datetime(2028, 9, 4)),
  "Thanksgiving Day 2028": new_date(datetime(2028, 11, 23)),
  "Christmas Day 2028": new_date(datetime(2028, 12, 25)),
}

@app.route("/")
def index():
  return render_template(
    "annual.html", 
    today=new_date(datetime.now()),
    holidays=holidays, 
    year=datetime.now().year, 
    months=build_months(datetime.now().date(), datetime.now().date() + timedelta(days=700))) 

if __name__ == "__main__":
  app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
