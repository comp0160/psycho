/**
 * @title haas
 * @description 
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HTMLButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import HTMLSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
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
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 1 },
        volume: -10,
        }).connect(merge, 0, 0);
    
    synthR = new Tone.Synth({
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 1 },
        volume: -10,
        }).connect(merge, 0, 1);
    
    Tone.Transport.start();
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

    const [REPS, STEP] = QUICK_TEST ? [5, 0.5] : [50, 0.25];
    const WAIT = 0.1;
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,
         
        `<p>This experiment demonstrates the <b>Haas effect</b>,<br>
         where stereo localisation is strongly affected by a short<br>
         inter-aural time difference.</p>
         <p>You are presented with a single note where the arrival at<br>
         each ear is sometimes delayed by a few milliseconds.<br>
         There may also be a volume difference between the ears.</p>
        `,
        
        `<p>There are 50 trials in this experiment and it will<br>
        take a few minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry<br>
        about occasional errors and uncertainty. <b>This is not a test!</b></p>
        <p>Before starting, please check that your headphone volume<br>
        is set to a comfortable level and your headphones are<br>
        the right way around.</p>
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
    
    
    let single_trial =
    {
        type: HTMLSliderResponsePlugin,
        stimulus: function ()
        {
            let now = Tone.Transport.now();
            synthL.triggerAttackRelease('A4', 0.25, now + jsPsych.timelineVariable('l_time'), jsPsych.timelineVariable('l_vel'));
            synthR.triggerAttackRelease('A4', 0.25, now + jsPsych.timelineVariable('r_time'), jsPsych.timelineVariable('r_vel'));
            
            return `<p>Adjust the slider to where you think the<br>
                    sound was coming from, from left to right<p>`;
        },
        min: -100,
        max: 100,
        slider_start: 0,
        slider_width: 600,
        data: {
            l_time: jsPsych.timelineVariable('l_time'),
            r_time: jsPsych.timelineVariable('r_time'),
            delay: jsPsych.timelineVariable('delay'),
            l_vel: jsPsych.timelineVariable('l_vel'),
            r_vel: jsPsych.timelineVariable('r_vel'),
            atten: jsPsych.timelineVariable('atten'),
            signed: jsPsych.timelineVariable('signed'),
            task: 'response',
        }
    };
    
    let timeline_vars = [];
    for ( let ii = 0; ii < REPS; ii++ )
    {
        let delay = ii * STEP * 0.001;
        let left_first = Math.random() > 0.5;
        let atten = Math.random();
        timeline_vars.push({
            l_time: left_first ? WAIT : WAIT + delay,
            r_time: left_first ? WAIT + delay: WAIT,
            delay: delay,
            l_vel: left_first ? 1 : atten,
            r_vel: left_first ? atten : 1,
            atten: atten,
            signed: left_first ? delay : -delay,
            signed_atten: left_first ? atten : -atten,
        });
    }
    
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
            download_name: 'comp160_lab3_haas.csv',
            stim_name: 'signed',
            blurb: 'The chart below plots your spatial estimate vs delay.',
            columns: [ 'rt', 'l_time', 'r_time', 'delay', 'l_vel', 'r_vel', 'atten', 'signed', 'signed_atten', 'response', 'time_elapsed' ],
            xlab: 'Delay (s)',
            ylab: 'Estimated Location',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );
    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
