from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

import requests
import json
from pytz import timezone
import pytz
from datetime import datetime
from operator import itemgetter

# Create your views here.


def index(request):
    return render(request, "trainhop/index.html")


@csrf_exempt
def timetable(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required!"}, status=400)
    else:
        data = json.loads(request.body)
        code = data.get("code", "")

        # download the station info for later use
        data = requests.get(
            "https://rata.digitraffic.fi/api/v1/metadata/stations")
        stations = data.json()

        # query the API from which the traffic information can be found
        # by modifying the url you can increase or decrease the amount of trains in the response
        response = requests.get(
            f"http://rata.digitraffic.fi/api/v1/live-trains/station/{code}?arrived_trains=0&arriving_trains=50&departed_trains=0&departing_trains=50&include_nonstopping=false")

        trains = response.json()
        # initialize arrivals and departures lists and create Helsinki timezone
        departures = []
        arrivals = []
        utc = pytz.utc
        hki = timezone('Europe/Helsinki')
        # loop through the trains
        for train in trains:
            # check if the train is a passenger train and start gathering data about the train
            if train["trainCategory"] == "Long-distance" or train["trainCategory"] == "Commuter":
                timeTableRows = train["timeTableRows"]
                # get departure and destination stations for the train
                last = len(timeTableRows)
                departureCode = timeTableRows[0]['stationShortCode']
                departureStation = station_name(stations, departureCode)

                destinationCode = timeTableRows[last - 1]['stationShortCode']
                destinationStation = station_name(stations, destinationCode)

                for row in timeTableRows:
                    if row["stationShortCode"] == code:
                        # if has estimate time / train is late, converts estimate time into datetime object and converts to Helsinki time
                        try:
                            liveEstimateTime = datetime.strptime(
                                row["liveEstimateTime"], "%Y-%m-%dT%H:%M:%S.%fZ")
                            liveEstimateTime = liveEstimateTime.replace(
                                tzinfo=utc)
                            liveEstimateTime = liveEstimateTime.astimezone(hki)
                            liveEstimateTime = liveEstimateTime.time()
                            liveEstimateTime = time_conversion(
                                liveEstimateTime)
                        except KeyError:
                            liveEstimateTime = ''

                        # do the above steps for scheduled time as well
                        scheduledTime = datetime.strptime(
                            row["scheduledTime"], "%Y-%m-%dT%H:%M:%S.%fZ")

                        scheduledTime = scheduledTime.replace(tzinfo=utc)
                        scheduledTime = scheduledTime.astimezone(hki)
                        scheduledDate = scheduledTime.date()
                        scheduledTime = scheduledTime.time()
                        scheduledTime = time_conversion(scheduledTime)

                        # get the time difference between the estimate and scheduled times
                        try:
                            difference = row['differenceInMinutes']
                        except:
                            difference = ''

                        track = row['commercialTrack']

                        trainCategory = train['trainCategory']
                        if train["trainCategory"] == "Commuter":
                            trainID = train["commuterLineID"]
                        else:
                            trainID = train["trainType"] + \
                                str(train["trainNumber"])

                        # check whether the row['type'] is ARRIVAL or DEPARTURE and assign to the correct list
                        if row['type'] == 'ARRIVAL':
                            arrivals.append({'category': trainCategory, 'id': trainID, 'track': track, 'scheduledDate': scheduledDate,
                                             'scheduledTime': scheduledTime, 'estimateTime': liveEstimateTime, 'timeDifference': difference, 'departureStation': departureStation})

                        elif row['type'] == 'DEPARTURE':
                            departures.append({'category': trainCategory, 'id': trainID, 'track': track, 'scheduledDate': scheduledDate,
                                               'scheduledTime': scheduledTime, 'estimateTime': liveEstimateTime, 'timeDifference': difference, 'destinationStation': destinationStation})

        # sort arrivals and departures based on scheduledTime and ad to a dict
        if len(arrivals) == 0:
            arrivals_dict = {'message': 'No arrivals'}
        else:
            arrivals = sorted(arrivals, key=itemgetter(
                'scheduledDate', 'scheduledTime'))
            # arrivals = sorted(arrivals, key=itemgetter('scheduledTime'))
            arrivals_dict = {}
            i = 0
            for arrival in arrivals:
                arrivals_dict[i] = arrival
                i += 1

        if len(departures) == 0:
            departures_dict = {'message': 'No departures'}
        else:
            departures = sorted(departures, key=itemgetter(
                'scheduledDate', 'scheduledTime'))
            # departures = sorted(departures, key=itemgetter('scheduledTime'))
            departures_dict = {}
            j = 0
            for departure in departures:
                departures_dict[j] = departure
                j += 1

        timetable = {'arrivals': arrivals_dict,
                     'departures': departures_dict}

        # finally, combine the two dicts together into one pass to the frontend
        return JsonResponse(timetable, safe=False)


def stations(request):
    if request.method == 'GET':
        # download the station info
        data = requests.get(
            "https://rata.digitraffic.fi/api/v1/metadata/stations")
        stations = data.json()

        # loop through the json data and add only relevant information to the response dict
        stations_dict = {}
        i = 0
        for station in stations:
            if station['passengerTraffic'] == True:
                if ' asema' in station['stationName'] or ' Asema' in station['stationName']:
                    station_name = station['stationName']
                    name = station_name[: -6]
                    stations_dict[i] = {
                        'code': station['stationShortCode'], 'name': name}
                else:
                    stations_dict[i] = {
                        'code': station['stationShortCode'], 'name': station['stationName']}
                i += 1

        return JsonResponse(stations_dict, safe=False)


def station_name(stations, code):
    for station in stations:
        if station['stationShortCode'] == code:
            if ' asema' in station['stationName'] or ' Asema' in station['stationName']:
                station_name = station['stationName']
                name = station_name[: -6]
            else:
                name = station['stationName']

    return(name)


# takes a datetime.time object as an argument and converts it to string
def time_conversion(time):
    if time.second >= 30:
        if time.minute == 59:
            minute = "0"
            hour = str(time.hour + 1)
        else:
            minute = str(time.minute + 1)
            hour = str(time.hour)
    else:
        minute = str(time.minute)
        hour = str(time.hour)

    if int(hour) < 10:
        hour = '0' + hour

    if len(minute) == 1:
        new_time = hour + ":" + "0" + minute
    else:
        new_time = hour + ":" + minute
    return(new_time)
