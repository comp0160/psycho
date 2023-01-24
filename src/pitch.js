/**
 * @title pitch
 * @description pitch audibility threshold test
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

// local shared code
import { spots_setup, spots_finish, simple_scatter, goto_url } from './shared/experimenta.js';

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version })
{
    // kludgy configuration switch for testing
    const query = new URLSearchParams(window.location.search);
    const QUICK_TEST = query.has('quick');
    const RETURN_PAGE = query.has('home') ? query.get('home') : '/';

    const REPS = QUICK_TEST ? 1 : 4;
    
    const UPPER_HZ = 22000;

    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,
         
        `<p>In this experiment you will be tested on the upper limit of<br>
        sound frequencies that you can hear.</p>
        <p>You will be played (alternately) a rising or descending tone,<br>
        and should press the button as soon as you (respectively) stop or start<br>
        being able to hear it.</p>
        `,
        
        `<p>There are 4 trials in each direction this experiment and it will<br>
        take a couple of minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry<br>
        about occasional errors and uncertainty. <b>This is not a test!</b></p>
        <p>Before starting, please check that your headphone volume is<br>
        at a comfortable level.</p>
        `,

        `<p>NB: data from this experiment is collected only in memory in this<br>
        browser on your own computer. It will not be reported elsewhere and no<br>
        personally identifying information is stored.</p>
        <p>At the end of the experiment you will be given the opportunity to save the<br>
        results to a CSV file for further analysis if you wish. This is not mandatory.<br>
        If you choose not to do so, the data cannot be recovered later.<br>
        But you can always run the experiment again to obtain new data.</p>
        `
    ];
    
    const [ jsPsych, timeline ] = spots_setup ( instructions, true );
    
    timeline.push({
        type: AudioButtonResponsePlugin,
        stimulus: 'assets/audio/silence.mp3',
        prompt:
        `<p>Most browsers prevent audio playback without user<br>
        interaction. Please click the button to ensure sounds<br>
        can be played.</p>`,
        choices: ['Allow Audio']
    });

    const pause =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "",
        choices: "NO_KEYS",
        trial_duration: 1500
    };
    
    const ascending_trial =
    {
        type: AudioButtonResponsePlugin,
        stimulus: 'assets/audio/sweep-up.m4a',
        prompt:
        `<p>Click when you can no longer hear the sound.</p>`,
        choices: ["It's Gone"],
        data:
        {
            task: 'response',
            direction: 'up',
            ascending: 1,
        },
        trial_ends_after_audio: true,
        on_finish: function (data)
        {
            data.thresh = data.rt;
        }
    };
    
    const descending_trial =
    {
        type: AudioButtonResponsePlugin,
        stimulus: 'assets/audio/sweep-down.m4a',
        prompt:
        `<p>Click when you start being able to hear the sound.</p>`,
        choices: ["Heard it!"],
        data:
        {
            task: 'response',
            direction: 'down',
            ascending: 0,
        },
        trial_ends_after_audio: true,
        on_finish: function (data)
        {
            data.thresh = data.rt ? (UPPER_HZ - data.rt) : data.rt;
        }
    };
    

    timeline.push({
        timeline: [ ascending_trial, pause, descending_trial, pause ],
        repetitions: REPS
    });

    timeline.push(...spots_finish());

    timeline.push( simple_scatter (jsPsych,
        {
            download_name: 'comp160_lab3_pitch.csv',
            stim_name: 'thresh',
            response_name: 'ascending',
            blurb: 'The chart below plots your cutoff threshold for each sweep.',
            columns: [ 'rt', 'direction', 'ascending', 'thresh', 'response', 'time_elapsed' ],
            xlab: 'Threshold Frequency (Hz)',
            ylab: 'Sweep Direction',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );
    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
