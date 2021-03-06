document.addEventListener('DOMContentLoaded', function () {
  // hide the results view and display the station list
  document.getElementById('result-view').style.display = 'none';
  document.getElementById('result-view').innerHTML = '';
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
  // attach the station search field to the search function
  document.getElementById('station-search').addEventListener('keyup', () => search())
})

// search goes through the list of stations on the page and filters them based on the user input in the station search field 
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
  // if user hits enter while typing, take the first item from the list of station and call timetable function
  document.getElementById('station-search').addEventListener('keypress', function (e) {
    if (e.key == 'Enter') {
      var station_list = document.getElementsByClassName('station');
      var j = 0;
      for (i = 0; i < station_list.length; i++) {
        if (station_list[i].style.display != 'none') {
          var station = station_list[i];
          var name = station.querySelector('.col-10').innerHTML;
          var code = station.querySelector('small').innerHTML;
          timetable(code, name);
          break;
        }
      }
    }
  });
}

function timetable(code, name) {
  // hide the station list and display the result view
  document.getElementById('result-view').style.display = 'block';
  document.getElementById('station-list').style.display = 'none';
  document.getElementById('station-list').innerHTML = '';

  document.getElementById('result-view').innerHTML = `<h4 id="headline-${name}" class="headline">${name}</h4>
                                                        <div class="row">
                                                        <div id="departures" class="col-sm"></div>
                                                        <div id="arrivals" class="col-sm"></div>
                                                      </div>`;

  // clear and hide the search box
  document.getElementById('station-search').value = '';
  document.getElementById('station-search').style.display = 'none';

  // reload the page by clicking the headline
  document.getElementById(`headline-${name}`).addEventListener('click', () => timetable(code, name));

  // get the data from the API and display
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

      if ("message" in station.arrivals) {
        arr_div.innerHTML = `<h5 class="headline">Arrivals</h5>
                                <i style="color:crimson;">${station.arrivals.message}</i>`;
      } else {
        arr_div.innerHTML = '<h5 class="headline">Arrivals</h5>';
        var a_length = Object.keys(station.arrivals).length;
        // create the toprow for the view
        var app_top = document.createElement('div');
        app_top.classList.add('toprow');
        app_top.innerHTML = `<div class="row">
                              <div class="col-2">Arrives</div>
                              <div class="col-2 d-flex justify-content-center">Train</div>
                              <div class="col-4">From</div>
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
            var estimateTime = '~' + station.arrivals[i]['estimateTime'];
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
                                  <div class="col-2"><strong>${scheduledTime}</strong></div>
                                  <div class="col-2 d-flex justify-content-center"><div class="${trainID}">${trainID}</div></div>
                                  <div class="col-4">${departureStation}</div>
                                  <div class="col-2 d-flex justify-content-center">${track}</div>
                                  <div class="col-2 d-flex justify-content-end red">${estimateTime}</div>
                              </div>`;
          arr_div.appendChild(arr_row);
        }
      }
      // then, loop through the departures side of the json and create the departures view
      var dep_div = document.getElementById('departures');
      if ("message" in station.departures) {
        dep_div.innerHTML = `<h5 class="headline">Departures</h5>
                                <i style="color:crimson;">${station.departures.message}</i>`;
      } else {
        dep_div.innerHTML = '<h5 class="headline">Departures</h5>';
        var d_length = Object.keys(station.departures).length;
        // create the toprow for the view
        var dep_top = document.createElement('div');
        dep_top.classList.add('toprow');
        dep_top.innerHTML = `<div class="row">
                            <div class="col-2">Departs</div>
                            <div class="col-2 d-flex justify-content-center">Train</div>
                            <div class="col-4">To</div>
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
            var estimateTime = '~' + station.departures[i]['estimateTime'];
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
                              <div class="col-2"><strong>${scheduledTime}</strong></div>
                              <div class="col-2 d-flex justify-content-center"><div class="${trainID}">${trainID}</div></div>
                              <div class="col-4">${destinationStation}</div>
                              <div class="col-2 d-flex justify-content-center">${track}</div>
                              <div class="col-2 d-flex justify-content-end red">${estimateTime}</div>
                          </div>`;
          dep_div.appendChild(dep_row);
        }
      }
    })
  event.preventDefault();
}