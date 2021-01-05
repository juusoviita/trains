document.addEventListener('DOMContentLoaded', function () {
  // hide the results view and display the station list
  document.getElementById('result-view').style.display = 'none';
  document.getElementById('station-list').style.display = 'block';

  var station_list = document.getElementById('station-list');
  // get the stations for the view
  fetch('stations')
    .then(response => response.json())
    .then(stations => {
      var length = Object.keys(stations).length;
      for (i = 0; i < length; i++) {
        const code = stations[i]['code'];
        const name = stations[i]['name'];
        var station = document.createElement('div');
        station.classList.add('station');
        station.setAttribute('id', code);
        station.innerHTML = `<div class="row">
                              <div class="col-10">${name}</div>
                              <div class="col-2 d-flex justify-content-end"><i><small>${code}</i></small></div>
                            </div>`;
        station_list.appendChild(station);
        document.getElementById(`${code}`).addEventListener('click', () => timetable(code, name));
      }
    })
  document.getElementById('station-search').addEventListener('keyup', () => search())
})

function search() {
  var search_bar = document.getElementById('station-search');
  var filter = search_bar.value.toUpperCase();
  var stations = document.getElementsByClassName('station');

  for (j = 0; j < stations.length; j++) {
    div = stations[j];
    var txtValue = div.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      stations[j].style.display = '';
    } else {
      stations[j].style.display = 'none';
    }
  }
}

function timetable(code, name) {
  // hide the station list and display the result view
  document.getElementById('result-view').style.display = 'block';
  document.getElementById('station-list').style.display = 'none';

  document.getElementById('result-view').innerHTML = `<h4 class="headline">${name}</h4>
                                                        <div class="row">
                                                        <div id="departures" class="col"></div>
                                                        <div id="arrivals" class="col"></div>
                                                      </div>`;

  fetch('/timetable', {
    method: 'POST',
    body: JSON.stringify({
      code: code
    })
  })
    .then(response => response.json())
    .then(station => {
      // first, loop through the arrivals side of the json and create the arrivals view
      var arr_div = document.getElementById('arrivals');
      arr_div.innerHTML = '<h5 class="headline">Arrivals</h5>';
      var a_length = Object.keys(station.arrivals).length;
      // create the toprow for the view
      var app_top = document.createElement('div');
      app_top.classList.add('toprow');
      app_top.innerHTML = `<div class="row">
                            <div class="col-2">Scheduled</div>
                            <div class="col-2 d-flex justify-content-center">Train</div>
                            <div class="col-4">Departure Station</div>
                            <div class="col-2 d-flex justify-content-center">Track</div>
                            <div class="col-2"></div>
                        </div>`;
      arr_div.appendChild(app_top);

      for (i = 0; i < a_length; i++) {
        var scheduledTime = station.arrivals[i]['scheduledTime'];
        var trainID = station.arrivals[i]['id'];
        var departureStation = station.arrivals[i]['departureStation'];
        var track = station.arrivals[i]['track'];
        if (station.arrivals[i]['timeDifference'] != '') {
          var estimateTime = station.arrivals[i]['estimateTime'];
        } else {
          var estimateTime = '';
        }

        var arr_row = document.createElement('div');
        if (i % 2 == 0) {
          arr_row.classList.add('timetable-even');
        } else {
          arr_row.classList.add('timetable-odd');
        }

        arr_row.innerHTML = `<div class="row">
                                <div class="col-2">${scheduledTime}</div>
                                <div class="col-2 d-flex justify-content-center">${trainID}</div>
                                <div class="col-4">${departureStation}</div>
                                <div class="col-2 d-flex justify-content-center">${track}</div>
                                <div class="col-2 d-flex justify-content-center"><span class="red">${estimateTime}</span></div>
                            </div>`;
        arr_div.appendChild(arr_row);
      }
      // then, loop through the departures side of the json and create the departures view
      var dep_div = document.getElementById('departures');
      dep_div.innerHTML = '<h5 class="headline">Departures</h5>';
      var d_length = Object.keys(station.departures).length;
      // create the toprow for the view
      var dep_top = document.createElement('div');
      dep_top.classList.add('toprow');
      dep_top.innerHTML = `<div class="row">
                            <div class="col-2">Scheduled</div>
                            <div class="col-2 d-flex justify-content-center">Train</div>
                            <div class="col-4">Destination Station</div>
                            <div class="col-2 d-flex justify-content-center">Track</div>
                            <div class="col-2"></div>
                          </div>`;
      dep_div.appendChild(dep_top);
      for (i = 0; i < d_length; i++) {
        var scheduledTime = station.departures[i]['scheduledTime'];
        var trainID = station.departures[i]['id'];
        var destinationStation = station.departures[i]['destinationStation'];
        var track = station.departures[i]['track'];

        if (station.departures[i]['timeDifference'] != '') {
          var estimateTime = station.departures[i]['estimateTime'];
        } else {
          var estimateTime = '';
        }

        var dep_row = document.createElement('div');
        if (i % 2 == 0) {
          dep_row.classList.add('timetable-even');
        } else {
          dep_row.classList.add('timetable-odd');
        }

        dep_row.innerHTML = `<div class="row">
                              <div class="col-2">${scheduledTime}</div>
                              <div class="col-2 d-flex justify-content-center">${trainID}</div>
                              <div class="col-4">${destinationStation}</div>
                              <div class="col-2 d-flex justify-content-center">${track}</div>
                              <div class="col-2 d-flex justify-content-center"><span class="red">${estimateTime}</span></div>
                          </div>`;
        dep_div.appendChild(dep_row);
      }
    })
}