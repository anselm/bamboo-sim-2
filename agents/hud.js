function createHUD() {
    const hudElement = document.createElement('div');
    hudElement.id = 'hud';
    Object.assign(hudElement.style, {
        position: 'fixed',
        top: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontWeight: 'bold',
        zIndex: '1000',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
    });
    document.body.appendChild(hudElement);
    return hudElement;
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.marginRight = '10px';
    button.style.padding = '5px 10px';
    button.style.fontSize = '14px';
    button.addEventListener('click', onClick);
    return button;
}

const hudElement = createHUD();
const yearElement = document.createElement('div');
const dayElement = document.createElement('div');
const timeElement = document.createElement('div');
const stepRateElement = document.createElement('div');

hudElement.appendChild(yearElement);
hudElement.appendChild(dayElement);
hudElement.appendChild(timeElement);
hudElement.appendChild(stepRateElement);

const buttonContainer = document.createElement('div');
buttonContainer.style.marginTop = '10px';

let previousStepRate = 0;
let isPaused = false;

const increaseButton = createButton('Speed Up', () => {
    if (!isPaused) {
        globalThis.time.secondsStepRate = Math.min(3600, globalThis.time.secondsStepRate + 100);
        previousStepRate = globalThis.time.secondsStepRate;
    }
});

const decreaseButton = createButton('Slow Down', () => {
    if (!isPaused) {
        globalThis.time.secondsStepRate = Math.max(100, globalThis.time.secondsStepRate - 100);
        previousStepRate = globalThis.time.secondsStepRate;
    }
});

const pauseButton = createButton('Pause', () => {
    if (isPaused) {
        globalThis.time.secondsStepRate = previousStepRate;
        pauseButton.textContent = 'Pause';
    } else {
        previousStepRate = globalThis.time.secondsStepRate;
        globalThis.time.secondsStepRate = 0;
        pauseButton.textContent = 'Resume';
    }
    isPaused = !isPaused;
});

buttonContainer.appendChild(increaseButton);
buttonContainer.appendChild(decreaseButton);
buttonContainer.appendChild(pauseButton);
hudElement.appendChild(buttonContainer);

function resolve(blob) {
    if (!blob.time || typeof blob.time !== 'object') return;
    const time = blob.time;

    const { years, dayOfYear, hourOfDay, secondOfDay } = time;
    const currentMinute = Math.floor((secondOfDay % 3600) / 60);
    const currentSecond = secondOfDay % 60;

    yearElement.textContent = `Year: ${years}`;
    dayElement.textContent = `Day: ${dayOfYear}`;
    timeElement.textContent = `Time: ${hourOfDay.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:${currentSecond.toString().padStart(2, '0')}`;
    stepRateElement.textContent = `Step Rate: ${time.secondsStepRate}`;
}

export const hud = {
    uuid: '/ux/hud',
    resolve
};
