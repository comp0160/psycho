/**
 * @title binaural_beats
 * @description 
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HTMLButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import CallFunctionPlugin from "@jspsych/plugin-call-function";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

import * as Tone from 'tone';

// local shared code
import { spots_setup, spots_finish, simple_scatter, goto_url } from './shared/experimenta.js';


var synthL = undefined;
var synthR = undefined;

export async function start_audio ()
{
    await Tone.start();
    console.log('audio is ready');
}

export async function init_synths ()
{
    const merge = new Tone.Merge();
    
    // maybe reconsider this, but:
    // bung in a bit of reverb on everything
    const reverb = new Tone.Reverb( { wet: 0.3 } );
    
    merge.chain(
        reverb,
        Tone.Destination
    );
    
    synthL = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 1 },
        volume: -10,
        }).connect(merge, 0, 0);
    
    synthR = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 1 },
        volume: -10,
        }).connect(merge, 0, 1);   
}

export async function release_synths ()
{
    synthL.triggerRelease();
    synthR.triggerRelease();
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

    const [REPS, STEP, PADS] = QUICK_TEST ? [5, 10, 2] : [40, 2, 5];
    const [LO_FREQ, HI_FREQ] = [ 140, 1000 ];

    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,
         
        `<p>This experiment demonstrates the phenomenon of <b>binaural beats</b>.</p>
         <p>You are presented with a simple sine tone in each ear and asked to<br>
         decide whether you are hearing the same tone, two separate tones, or<br>
         an oscillating "beat" caused by perceptual interference between two tones.</p>
        `,
        
        `<p>There are about 45 trials in this experiment and it will<br>
        take a few minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry<br>
        about occasional errors and uncertainty. <b>This is not a test!</b></p>
        <p>Before starting, please check that your headphone volume<br>
        is set to a comfortable level.</p>
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
        stimulus: `<p>Most browsers prevent audio playback without user<br>
                    interaction. Please click the button to ensure sounds<br>
                    can be played.</p>`,
        choices: ['Allow Audio'],
        on_load: function ()
        {
            document.querySelector('#jspsych-html-button-response-button-0').addEventListener('click', start_audio);
        }
    });
    
    timeline.push({
        type: CallFunctionPlugin,
        func: async function ()
        {
            await init_synths();
        }
    });

    const pause =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "",
        choices: "NO_KEYS",
        trial_duration: 1500
    };
    
    timeline.push( pause );
    
    const timeline_vars = [];
    for ( let ii = 0; ii < REPS; ++ii )
    {
        let freq1 = Math.round(Math.random() * (HI_FREQ - LO_FREQ) + LO_FREQ);
        let dir = Math.random() > 0.5 ? 1 : -1;
        let freq2 = freq1 + dir * ii * STEP;
        
        timeline_vars.push( { f1: freq1, f2: freq2, diff: freq2 - freq1, dir: dir, abs: Math.abs(freq2 - freq1) } );
    }
    
    for ( let ii = 0; ii < PADS; ++ii )
    {
        let freq1 = Math.round(Math.random() * (HI_FREQ - LO_FREQ) + LO_FREQ);
        let dir = Math.random() > 0.5 ? 1 : -1;
        let freq2 = freq1 + dir * ii * STEP;
        
        timeline_vars.push( { f1: freq1, f2: freq1, diff: 0, dir: 0, abs: 0 } );
    }
    
    
    let single_trial =
    {
        type: HTMLButtonResponsePlugin,
        stimulus: function ()
        {
            synthL.triggerAttack(jsPsych.timelineVariable('f1'));
            synthR.triggerAttack(jsPsych.timelineVariable('f2'));
            
            return `<p>Do you hear a single tone, two distinct tones<br>
                       or a beating interference pattern?</p>`
        },
        choices: ['Single Tone', 'Beats', 'Two Tones'],
//         on_load: function ()
//         {
//             document.querySelector('#jspsych-html-button-response-button-0').addEventListener('click', release_synths);
//             document.querySelector('#jspsych-html-button-response-button-1').addEventListener('click', release_synths);
//         },
        data: {
            f1: jsPsych.timelineVariable('f1'),
            f2: jsPsych.timelineVariable('f2'),
            diff: jsPsych.timelineVariable('diff'),
            dir: jsPsych.timelineVariable('dir'),
            abs: jsPsych.timelineVariable('abs'),
            task: 'response',
        }
    };
    
    const cleanup =
    {
        type: CallFunctionPlugin,
        func: async function ()
        {
            await release_synths();
        }
    }
    
    timeline.push({
        timeline: [ single_trial, cleanup, pause ],
        timeline_variables: timeline_vars,
        randomize_order: true
    });
    
    timeline.push(...spots_finish());

    timeline.push( simple_scatter (jsPsych,
        {
            download_name: 'comp160_lab3_binaural_beats.csv',
            stim_name: 'abs',
            blurb: 'The chart below plots whether you heard beats<br>according to the absolute frequency difference.',
            columns: [ 'rt', 'f1', 'f2', 'diff', 'dir', 'response', 'time_elapsed', 'abs' ],
            xlab: 'Frequency Difference (Hz)',
            ylab: 'Detected',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );
    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
