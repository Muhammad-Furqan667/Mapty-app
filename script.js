'use strict';

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration){
        this.coords = coords;      // [lat, lng]
        this.distance = distance;    // in km
        this.duration = duration;   // in min
    }

    _setDescription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
     }

     calcPace(){
        //min?km
        this.pace = this.duration / this.distance;
        return this.pace
     }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }    
 
    calcSpeed(){
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

/////////////////////////////////////
//Application Arthitecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App{
    #map;
    #mapZoomLavel = 13;
    #mapEvent;
    #workouts = [];
    constructor(){
        // Get user's position
        this._getPosition(); 
        
        //get data  from local storage
        this._getLocalStorage();

        //Add event listener
        form.addEventListener('submit', this._newWorkout.bind(this));    
        inputType.addEventListener('change', this._toggleElevatorField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));        
        
    }
    //////////////////////////////
    //Getting current state
    _getPosition(){
        if(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {     // Showing current position                  
        alert('Could not get your position');  // else if false
    })
}
////////////////////////////////
// setting current state
_loadMap(position){                      // if true
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLavel);
    //////////////   OR ///////////////
    // console.log(`https://www.google.com//@${latitude},${longitude}`);
    

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {                  //Calling map API (leaflet)
        attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    
    this.#map.on('click', this._showForm.bind(this));          // Show form

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);   //Local storage
        })
        
    }
    /////////////////////////////////////
    _showForm(mapE) {             // Show foam where we enter value
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();        
    }
    //////////////////////////////////
    _hideForm(){              // Hideng displayng value
        //Empty input
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ' ';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid',1000);
    }
     ////////////////////////////////
    _toggleElevatorField() {               // Toggling running and cycling
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');        
}
/////////////////////////////
_newWorkout(e) {
    e.preventDefault();              // Checkingcondition for enter number
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const validNumber = (...inputs) => inputs.every(inp => inp > 0);

    // Get data from form
    const type  = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const {lat, lng} = this.#mapEvent.latlng;
    let workout;
    //If workout running, create running project
    if(type === 'running'){
        const cadence = +inputCadence.value;
        //Check if data is valid
        if(!validInputs(distance, duration, cadence) || !validNumber(distance, duration, cadence)) 
            return alert('Input have to be positive numbers');   // if false

            workout = new Running([lat, lng], distance, duration, cadence);  //if data true then running
   }

   //If workout cycling, create cycling project
   if(type === 'cycling'){
    const elevation = +inputElevation.value;
        if(!validInputs(distance, duration, elevation) || 
        !validNumber(distance, duration))       return alert('Input have to be positive numbers');
           
        workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    
    //Add new object to workout array
    this.#workouts.push(workout);

   //Render  workout on map as marker
   this._renderWorkoutMarker(workout);
   
   //Render workout on list
   this._renderWorkout(workout);

   //Hide form + Clear input fields
   this._hideForm();

   // Set local storage to all workout;
   this._setLocalStorage();
}

/////////////////////////////////////
/////////// ON map show marker
_renderWorkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })
            ).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }
     /////////////////////////////////////
    // Show on foam/files
    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `
    if(workout.type === 'running'){
        html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
          </li>`
    }

    if(workout.type === 'cycling'){
        html += ` <div class="workout__details">
        <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
        </div>
        </li>`;
    }  
    form.insertAdjacentHTML('afterend', html);
    }

     /////////////////////////////////////
    _moveToPopup(e){        // use for local library to get data
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl); 
        if(!workoutEl) return;

        const workout= this.#workouts.find(work => work.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords, this.#mapZoomLavel, {
            animate: true,
            pan: {
                duration: 1,
            }
        })
    }
     /////////////////////////////////////
    _setLocalStorage(){       //storing data in local storage
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    ///////////////////////////////////
    _getLocalStorage(){    //Taking data from local storage
        const data = JSON.parse(localStorage.getItem('workouts'));
        if(!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }
     ///////////////////////////////////////
    reset(){          // reset the local storage 
        localStorage.removeItem('workouts');
        location.reload();
    }
}
const app = new App(); 
