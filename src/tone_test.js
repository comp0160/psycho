/**
 * @title tone_test
 * @description quick check to see whether using the Tone audio framework is viable
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HTMLButtonResponsePlugin from "@jspsych/plugin-html-button-response";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

import * as Tone from 'tone';

// local shared code
import { spots_setup, spots_finish, single_dataset_chart, goto_url } from './shared/experimenta.js';


export async function start_audio ()
{
    await Tone.start();
    console.log('audio is ready');
    
//    await piano_phase();
}

export async function piano_phase ()
{
    // set the bpm and time signature first
    Tone.Transport.timeSignature = [6, 4];
    Tone.Transport.bpm.value = 180;
            
    // L/R channel merging
    const merge = new Tone.Merge();

    // a little reverb
    const reverb = new Tone.Reverb({
        wet: 0.3
    });

    merge.chain(reverb, Tone.Destination);

    // left and right synthesizers
    const synthL = new Tone.Synth({
        oscillator: {
            type: "custom",
            partials: [2, 1, 2, 2],
        },
        envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0.2,
            release: 1,
        },
        portamento: 0.01,
        volume: -20
    }).connect(merge, 0, 0);
    const synthR = new Tone.Synth({
        oscillator: {
            type: "custom",
            partials: [2, 1, 2, 2],
        },
        envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0.2,
            release: 1,
        },
        portamento: 0.01,
        volume: -20
    }).connect(merge, 0, 1);

    // the two Tone.Sequences
    const partL = new Tone.Sequence(((time, note) => {
        synthL.triggerAttackRelease(note, "8n", time);
    }), ["E4", "F#4", "B4", "C#5", "D5", "F#4", "E4", "C#5", "B4", "F#4", "D5", "C#5"], "8n").start();

    const partR = new Tone.Sequence(((time, note) => {
        synthR.triggerAttackRelease(note, "8n", time);
    }), ["E4", "F#4", "B4", "C#5", "D5", "F#4", "E4", "C#5", "B4", "F#4", "D5", "C#5"], "8n").start("2m");

    // set the playback rate of the right part to be slightly slower
    partR.playbackRate = 0.985;
    
    Tone.Transport.start();
}

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

    const QUICK_TRIALS = 5;

    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,
         
        `<p>In this experiment you are asked to estimate where a<br>
        sound is coming from. There are several different sounds, and<br>
        they may be positioned laterally anywhere from left to right.</p>
        <p>After each sound is played, position the slider where you<br>
        think the sound originated.</p>
        `,
        
        `<p>There are about 60 trials in this experiment and it will<br>
        take a few minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry<br>
        about occasional errors and uncertainty. <b>This is not a test!</b></p>
        <p>Before starting, please check that your headphones/earbuds<br>
        are the right way around.</p>
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
    
    const [ jsPsych, timeline ] = spots_setup ( instructions );
    
    timeline.push({
        type: HTMLButtonResponsePlugin,
        stimulus: `<p>Many browsers prevent audio playback without user<br>
                    interaction. Please click the button to ensure sounds<br>
                    can be played.</p>`,
        choices: ['Allow Audio'],
        //button_html: '<button class="jspsych-btn" onclick="Tone.start();">%choice%</button>',
        on_load: function ()
        {
            document.querySelector('#jspsych-html-button-response-button-0').addEventListener('click', start_audio);
        }
    });
    
    timeline.push(...spots_finish());

//     timeline.push( single_dataset_chart (jsPsych, stimuli,
//         {
//             download_name: 'comp160_lab3_stereo.csv',
//             stim_name: 'pos',
//             blurb: 'The chart below plots your estimate vs the true position.',
//             columns: [ 'rt', 'pos', 'sound', 'response', 'time_elapsed' ],
//             xlab: 'True Position',
//             ylab: 'Estimate',
//             factor: 1
//         }));
//     timeline.push( goto_url(RETURN_PAGE) );
     await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
