'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); //better to use libraries to create unique ID

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    let options = { year: 'numeric', month: 'long', day: 'numeric' };

    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${new Intl.DateTimeFormat('en-US', options).format(this.date)}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    //this.type = 'cycling'; // another option
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const workoutContainer = document.querySelector('.workouts');
// Form inputs
const form = document.querySelector('.form');
const inputType = document.querySelector('#workout-type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// Edit inputs
const editForm = document.querySelector('.form-edit');
const editInputType = document.querySelector('#edt-wrkt-type');
const editInputDistance = document.querySelector('#edt-wrkt-distance');
const editInputDuration = document.querySelector('#edt-wrkt-duration');
const editInputCadence = document.querySelector('#edt-wrkt-cadence');
const editInputElevation = document.querySelector('#edt-wrkt-elevation');
const saveChanges = document.querySelector('.form_btn-save');
const cancelChanges = document.querySelector('.form_btn-cancel');
// Delete All options
const deleteContainer = document.querySelector('.dlt-container');
// Sorting
const sortList = document.querySelector('#sort_list');
// Form error
const formError = document.querySelector('.form-error');
const formEditError = document.querySelector('#form-edit-error');
const cnclBtns = document.querySelectorAll('.form__btn--dismiss');

class App {
  #map;
  #mapZoomLvl = 13;
  #mapEvent;
  #userCoords = [];
  #workouts = [];
  #workoutMarkers = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers

    form.addEventListener('submit', this._newWorkout.bind(this));
    editForm.addEventListener('submit', this._editWorkout.bind(this));

    cnclBtns.forEach(btn => btn.addEventListener('click', this._dismissError));

    inputType.addEventListener(
      'change',
      this._toggleElevationField.bind('_', inputCadence, inputElevation)
    );
    editInputType.addEventListener(
      'change',
      this._toggleElevationField.bind('_', editInputCadence, editInputElevation)
    );

    cancelChanges.addEventListener('click', this._hideEditForm);
    document.body.addEventListener('click', this._handleClickForm.bind(this));
    workoutContainer.addEventListener('click', this._moveToPopup.bind(this));

    deleteContainer.addEventListener(
      'click',
      this._deleteAllWorkouts.bind(this)
    );
  }

  _checkMenuLinks(e) {
    if (this.#workouts.length === 0) {
      document
        .querySelectorAll('.menu__link')
        .forEach(link => link.classList.add('disabled'));
      sortList.innerHTML = 'date';
    } else {
      document
        .querySelectorAll('.menu__link')
        .forEach(link => link.classList.remove('disabled'));
    }
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(pos) {
    const { latitude: lat, longitude: lng } = pos.coords;

    // Saving the initial coords of the user
    this.#userCoords[0] = lat;
    this.#userCoords[1] = lng;

    // Creating Leafet map
    this.#map = L.map('map').setView([lat, lng], this.#mapZoomLvl); //map in the map method is the id in HTML

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Render marker and popup
    const marker = L.marker([lat, lng]).addTo(this.#map);
    marker
      .bindPopup(
        L.popup({
          minWidth: 240,
          autoClose: false,
          className: 'initial-popup',
        }).setContent(
          `You are <strong>here</strong>.<br> Click on the map to add a new workout`
        )
      )
      .openPopup();

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));

    // Loading workouts list and markers from local storage
    this.#map.whenReady(this._getLocalStorage.bind(this));

    // Disable links if there are no workouts in the list
    this._checkMenuLinks();
  }

  _showForm(mapE) {
    // render popup
    this.#mapEvent = mapE;
    const { lat, lng } = mapE.latlng;

    const popup = L.popup()
      .setLatLng([lat, lng])
      .setContent('Add workout')
      .openOn(this.#map);

    // show form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField(elev_input, cadence_input) {
    elev_input.closest('.form__row').classList.toggle('form__row--hidden');
    cadence_input.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // (...inputs) -> array; all input's values must be numbers

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value; //converted to a Number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, create running obj
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid in the input
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        formError.classList.remove('hidden');
        return;
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, create cycling obj
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        formError.classList.remove('hidden');
        return;
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    formError.style.display = 'none';
    formError.classList.add('hidden');
    setTimeout(() => (formError.style.display = 'flex'), 500);

    // Add new obj to workout array
    this.#workouts.push(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on the list
    this._renderWorkoutList(workout);

    this._checkMenuLinks();

    // Set Local Storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout, newMarker = true, editMarker = false) {
    const marker = L.marker(workout.coords).addTo(this.#map);
    const popup = L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    }).setContent(
      `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
    );
    marker.bindPopup(popup).openPopup();

    if (newMarker) this.#workoutMarkers.push(marker);

    if (editMarker) {
      const markerIndx = this.#workoutMarkers.findIndex(marker => {
        return (
          marker._latlng.lat === workout.coords[0] &&
          marker._latlng.lng === workout.coords[1]
        );
      });

      // Delete an old marker from UI map
      this.#map.removeLayer(this.#workoutMarkers[markerIndx]);
      // Delete from workoutMarkers array
      this.#workoutMarkers.splice(markerIndx, 1, marker);
    }
  }

  _renderWorkoutList(workout, adding = true, editing = false) {
    const html = `
    <li class="workout workout--${workout.type}${
      editing ? ' editing' : ''
    }" data-id="${workout.id}">
    
      <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
            <span class="workout__icon workout__icon--type">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value workout__value--distance">${
              workout.distance
            }</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value workout__value--duration">${
              workout.duration
            }</span>
            <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value workout__value--paceSpeed">${
              workout.type === 'running'
                ? workout.pace.toFixed(1)
                : workout.speed.toFixed(1)
            }</span>
            <span class="workout__unit workout__unit--paceSpeed">${
              workout.type === 'running' ? 'min/km' : 'km/h'
            }</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon workout__icon--cadenceElevation">${
              workout.type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value workout__value--cadenceElevation">${
              workout.type === 'running' ? workout.cadence : workout.elevation
            }</span>
            <span class="workout__unit workout__icon--cadenceElevation">${
              workout.type === 'running' ? 'spm' : 'm'
            }</span>
        </div>
        <div class="workout_list_add-actions">
          <i class="fa-solid fa-ellipsis-vertical workout_list_add-actions__act workout_list_add-actions__icons"></i>

          <ul class="workout__list-options workout__list-options--hidden">
            <li>
              <a class="workout__list-option workout__list-option--edit" href="#">
                <i class="fa-solid fa-pencil workout__list-icons"></i> Edit Workout
              </a>
            </li>

            <li>
              <a class="workout__list-option workout__list-option--delete" href="#">
                <i class="fa-solid fa-trash workout__list-icons"></i> Delete Workout
              </a>
            </li>
          </ul>
        </div>
    </li>
    `;

    if (adding) {
      workoutContainer.insertAdjacentHTML('afterbegin', html);
    }

    if (editing) {
      // Delete old workout and adding a new one in the same position
      const currentWorkout = document.querySelector(
        `.workout[data-id="${workout.id}"]`
      );

      currentWorkout.style.display = 'none';
      currentWorkout.insertAdjacentHTML('afterend', html);
      currentWorkout.remove();
    }
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    //using Leaflet method to zoom the needed point
    this.#map.setView(workout.coords, this.#mapZoomLvl, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _handleClickForm(e) {
    // Close all opened popups to start a new action
    this._closeAllPopups();

    if (
      (!e.target.closest('.workout_list_add-actions') &&
        !e.target.closest('.menu__option')) ||
      editForm.classList.contains('active') ||
      !deleteContainer.classList.contains('delete-confirmation--hidden')
    )
      return;

    document
      .querySelectorAll('.menu__link.active')
      .forEach(link => link.classList.remove('active'));

    if (e.target.closest('.workout_list_add-actions')) {
      e.target
        .closest('.workout_list_add-actions')
        .querySelector('.workout__list-options')
        .classList.remove('workout__list-options--hidden');

      // Moving the map automatically on the marker
      this._moveToPopup(e);

      // Edit workout
      if (e.target.closest('.workout__list-option--edit')) {
        e.preventDefault();
        this._showEditedForm(e);
      }

      // Delete workout
      if (e.target.closest('.workout__list-option--delete')) {
        e.preventDefault();
        this._deleteWorkout(e);
      }
    }

    // Click on main menu ("Show All" / "Delete All" / "Sort")
    if (e.target.closest('.menu__option')) {
      // if all links are disabled, exit the function
      const disabledLink = e.target.querySelector('.disabled');

      if (disabledLink) return;

      // adding active link if menu was clicked
      if (e.target.closest('.menu__link')) {
        e.target.closest('.menu__link').classList.add('active');
      }

      // Show all markers on the map
      if (e.target.closest('.menu__option--show')) {
        e.preventDefault();

        // Zoom on the map
        const group = new L.featureGroup(this.#workoutMarkers); //combine all markers
        this.#map.fitBounds(group.getBounds());
      }

      // Show Delete confirmation alert
      if (e.target.closest('.menu__option--delete')) {
        e.preventDefault();

        document
          .querySelector('.dlt-container')
          .classList.remove('delete-confirmation--hidden');
      }

      // Sorting
      if (e.target.closest('.menu__option--sort')) {
        e.preventDefault();

        // Show sorting menu
        document
          .querySelector('.menu__menu-sort')
          .classList.remove('menu__menu-sort--hidden');

        // Adding active class to sort links
        e.target
          .closest('.menu__option--sort')
          .querySelector('.menu__link')
          .classList.add('active');

        // Sorting by date
        if (e.target.closest('.menu__menu-sort-option--date')) {
          e.preventDefault();

          // Hide sorting menu
          document
            .querySelector('.menu__menu-sort')
            .classList.add('menu__menu-sort--hidden');

          // Actual sorting process (by default)
          this._sortWorkouts();
        }

        // Sorting by distance
        if (e.target.closest('.menu__menu-sort-option--distance')) {
          e.preventDefault();

          // Hide sorting menu
          document
            .querySelector('.menu__menu-sort')
            .classList.add('menu__menu-sort--hidden');

          this._sortWorkouts('distance');
        }

        // Sorting by duration
        if (e.target.closest('.menu__menu-sort-option--duration')) {
          e.preventDefault();

          // Hide sorting menu
          document
            .querySelector('.menu__menu-sort')
            .classList.add('menu__menu-sort--hidden');

          this._sortWorkouts('duration');
        }
      }
    }
  }

  _closeAllPopups() {
    document
      .querySelectorAll('.workout__list-options')
      .forEach(list => list.classList.add('workout__list-options--hidden'));

    document
      .querySelector('.menu__menu-sort')
      .classList.add('menu__menu-sort--hidden');
  }

  _sortWorkouts(opt = 'date') {
    // show sort label according to the chosen option of sorting
    sortList.innerHTML = opt;

    // Making the workout list part empty except form
    document.querySelectorAll('.workout').forEach(el => el.remove());

    this.#workouts
      .slice()
      .sort((a, b) => {
        return a[opt] - b[opt];
      })
      .forEach(workout => {
        this._renderWorkoutList(workout);
      });
  }

  _deleteWorkout(e) {
    const dltItem = e.target.closest('.workout'); // item in the list that has to be deleted

    const workoutCoords = this.#workouts.find(
      work => work.id === dltItem.dataset.id
    ).coords;

    const markerIndx = this.#workoutMarkers.findIndex(marker => {
      return (
        marker._latlng.lat === workoutCoords[0] &&
        marker._latlng.lng === workoutCoords[1]
      );
    });

    // Delete from UI map
    this.#map.removeLayer(this.#workoutMarkers[markerIndx]);
    // Delete from workoutMarkers array
    this.#workoutMarkers.splice(markerIndx, 1);
    // Delete from UI list
    dltItem.remove();

    // Delete from #workouts array
    const indx = this.#workouts.findIndex(
      wrkt => wrkt.id === dltItem.dataset.id
    );
    this.#workouts.splice(indx, 1);

    // Disable links if there are no workouts in the list
    this._checkMenuLinks();

    // Updating localStorage or resetting it if there are no more workouts
    if (this.#workouts.length !== 0) {
      this._setLocalStorage();
    } else {
      localStorage.removeItem('workouts');
    }

    // Going back to user's current position if was deleted the last workout in the list
    this.#map.setView(this.#userCoords, this.#mapZoomLvl, {
      animate: true,
      duration: 1.4,
    });
  }

  _showEditedForm(e) {
    const workoutListItem = e.target.closest('.workout');

    // Fill the edit-form with current input values
    const workout = this.#workouts.find(
      work => work.id === workoutListItem.dataset.id
    );

    editInputDistance.value = workout.distance;
    editInputDuration.value = workout.duration;

    if (workout.type === 'running') {
      editInputType
        .querySelectorAll('option')
        .forEach(opt => opt.removeAttribute('selected'));
      editInputType
        .querySelector('option[value=running]')
        .setAttribute('selected', 'selected');

      editInputCadence
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      editInputElevation
        .closest('.form__row')
        .classList.add('form__row--hidden');

      editInputCadence.value = workout.cadence;
    }

    if (workout.type === 'cycling') {
      editInputType
        .querySelectorAll('option')
        .forEach(opt => opt.removeAttribute('selected'));
      editInputType
        .querySelector('option[value=cycling]')
        .setAttribute('selected', 'selected');

      editInputCadence.closest('.form__row').classList.add('form__row--hidden');
      editInputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');

      editInputElevation.value = workout.elevation;
    }

    // Positioning edit-form
    editForm.style.top = `${
      workoutListItem.getBoundingClientRect().top -
      workoutContainer.getBoundingClientRect().top +
      workoutContainer.scrollTop
    }px`;

    // Moving aside the workout list item and show the edit-form
    editForm.classList.remove('form-editing--hidden');
    workoutListItem.classList.add('editing');

    setTimeout(() => editForm.classList.add('animated', 'active'), 0);

    //while edit-form is visible - no scrolling on .workout div
    workoutContainer.style.overflowY = 'hidden';
  }

  _editWorkout(e) {
    e.preventDefault();

    const checkNumbers = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // (...inputs) -> array; all input's values must be numbers

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Adding edit-form
    const workoutItem = e.target.closest('.workouts').querySelector('.editing');
    const workoutId = workoutItem.dataset.id;
    // Finding the workout in this.#workouts array
    const workout = this.#workouts.find(workout => workout.id === workoutId);

    // Collecting form data
    const type = editInputType.value;

    const distance = +editInputDistance.value;
    const duration = +editInputDuration.value;

    // If user choose type=running(by default) => replace old values in the #workout array with new values
    // If user choose type=cycling => delete runnung workout type from the #workout array and push a new workout type in the same position, change the color of popup, change cadence -> elevation

    // Type = running; editType = running
    if (type === 'running' && workout.type === 'running') {
      const cadence = +editInputCadence.value;

      if (
        !checkNumbers(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        formEditError.classList.remove('hidden');
        return;
      }

      // Update the values of the workout obj
      this._updateObjWorkout(workout, distance, duration, cadence, false);

      // Update the values in UI (list workout)
      this._updateWorkout(workoutItem, distance, duration, cadence, false);

      // Hide edit-from
      this._hideEditForm(e);
    }

    // Type = cycling; editType = cycling
    if (type === 'cycling' && workout.type === 'cycling') {
      const elevation = +editInputElevation.value;

      if (
        !checkNumbers(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        formEditError.classList.remove('hidden');
        return;
      }

      // Update the values of the workout obj
      this._updateObjWorkout(workout, distance, duration, false, elevation);

      // Update the values in UI (list workout)
      this._updateWorkout(workoutItem, distance, duration, false, elevation);

      // Hide edit-from
      this._hideEditForm(e);
    }

    // Type = running; editType = cycling
    if (type === 'cycling' && workout.type === 'running') {
      const elevation = +editInputElevation.value;

      if (
        !checkNumbers(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        formEditError.classList.remove('hidden');
        return;
      }

      // Creating a new workout obj with the same coords as old + new values from edit-form
      const newWorkout = new Cycling(
        workout.coords,
        distance,
        duration,
        elevation
      );

      // Keeping the date and id the same as from prev workout
      newWorkout.date = workout.date;
      newWorkout.id = workout.id;

      // Replace the old workout with a new one in #workouts array
      const workoutIndx = this.#workouts.findIndex(
        workout => workout.id === workoutId
      );
      this.#workouts.splice(workoutIndx, 1, newWorkout);
      // Replace the old workout item in the list with the new one
      this._renderWorkoutList(newWorkout, false, true);

      // Update marker
      this._renderWorkoutMarker(newWorkout, false, true);

      // Hide edit-from
      setTimeout(() => this._hideEditForm(e), 0);
    }

    // Type = cycling; editType = running
    if (type === 'running' && workout.type === 'cycling') {
      const cadence = +editInputCadence.value;

      if (
        !checkNumbers(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        formEditError.classList.remove('hidden');
        return;
      }

      const newWorkout = new Running(
        workout.coords,
        distance,
        duration,
        cadence
      );

      newWorkout.date = workout.date;
      newWorkout.id = workout.id;

      const workoutIndx = this.#workouts.findIndex(
        workout => workout.id === workoutId
      );
      this.#workouts.splice(workoutIndx, 1, newWorkout);

      this._renderWorkoutList(newWorkout, false, true);

      this._renderWorkoutMarker(newWorkout, false, true);

      setTimeout(() => this._hideEditForm(e), 0);
    }

    // Update Local Storage
    this._setLocalStorage();
  }

  _updateObjWorkout(wrkt, distance, duration, cadence, elevation) {
    wrkt.distance = distance;
    wrkt.duration = duration;

    wrkt.cadence ? (wrkt.cadence = cadence) : (wrkt.elevation = elevation);

    wrkt.pace
      ? (wrkt.pace = duration / distance)
      : (wrkt.speed = distance / (duration / 60));
  }

  _updateWorkout(wrktItem, distance, duration, cadence, elevation) {
    wrktItem.querySelector('.workout__value--distance').innerHTML = distance;
    wrktItem.querySelector('.workout__value--duration').innerHTML = duration;

    if (cadence) {
      wrktItem.querySelector('.workout__value--paceSpeed').innerHTML = (
        duration / distance
      ).toFixed(1);
      wrktItem.querySelector('.workout__value--cadenceElevation').innerHTML =
        cadence;
    }

    if (elevation) {
      wrktItem.querySelector('.workout__value--paceSpeed').innerHTML = (
        distance /
        (duration / 60)
      ).toFixed(1);
      wrktItem.querySelector('.workout__value--cadenceElevation').innerHTML =
        elevation;
    }
  }

  _hideEditForm(e) {
    editForm.classList.remove('animated', 'active');

    // Find current editing form and remove class .edit to show edited version of workout
    e.target
      .closest('.workouts')
      .querySelector('.editing')
      .classList.remove('editing');

    // Adding class hidden after the animation is complete
    setTimeout(() => {
      editForm.classList.add('form-editing--hidden');
    }, 350);

    workoutContainer.style.overflowY = 'scroll';
  }

  _dismissError(e) {
    e.target.closest('.form-error').classList.add('hidden');
  }

  _deleteAllWorkouts(e) {
    // if user clicks outside the buttons -> exit the function
    const conf_btn = e.target.closest('.delete-confirmation__btn');
    if (!conf_btn) return;

    // Delete All workouts - 'Yes' button
    if (conf_btn.classList.contains('delete-confirmation__btn--yes')) {
      // Close 'confirmation delete warning' and remove .active class from the link
      deleteContainer.classList.add('delete-confirmation--hidden');
      document.querySelector('.menu__link.active').classList.remove('active');

      // Remove all workouts from #workouts array
      this.#workouts.splice(0);

      // Delete all workouts from UI (list and markers) ONLY after 'confirmation delete warning' disappears
      const deleteAllUI = function () {
        // delete all workouts from the list
        document
          .querySelectorAll('.workout')
          .forEach(wrktEl => wrktEl.remove());

        // delete all markers from the map: first, delete from UI, after - from array (so it will not be empty at the start)
        this.#workoutMarkers.forEach(marker => this.#map.removeLayer(marker));

        this.#workoutMarkers.splice(0);

        // Position on user's current position
        this.#map.setView(this.#userCoords, this.#mapZoomLvl, {
          animate: true,
          duration: 1.5,
        });

        // Disable all menu links after deleting workouts from the list
        this._checkMenuLinks();
      }.bind(this);

      setTimeout(deleteAllUI, 400);

      // remove stored data from local storage
      localStorage.removeItem('workouts');
    }

    // Cancel any changes - 'No' button
    if (conf_btn.classList.contains('delete-confirmation__btn--no')) {
      deleteContainer.classList.add('delete-confirmation--hidden');
      document.querySelector('.menu__link.active').classList.remove('active');
    }
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => this._renderWorkoutList(work)); // show already existed workouts on the list
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload(); // refresh the page
  }
}

const app = new App();
