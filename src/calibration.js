/**
 * @title calibration
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
    const reverb = new Tone.Reverb( { wet: 0.5 } );
    
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
        `<p>Welcome to the COMP0160 audio calibration test.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,
         
        `<p>Please turn your headphone volume completely down.</p>
        `,
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
        
    timeline.push({
        type: HTMLButtonResponsePlugin,
        stimulus: function ()
        {
            synthL.triggerAttack('C3');
            synthR.triggerAttack('C3');
            
            return `<p>Gradually increase your headphone volume until the<br>
                       sound is clearly audible and at a comfortable level.<br>
                       It should not feel <b>loud</b></p>
                    <p>If you can't hear any sound, wave at the tutors for help!</p>`
        },
        choices: ["I'm Happy"],
    });
    
    const cleanup =
    {
        type: CallFunctionPlugin,
        func: async function ()
        {
            await release_synths();
        }
    }
    
    timeline.push( cleanup );
    timeline.push( pause );
    
    timeline.push({
        type: HTMLButtonResponsePlugin,
        stimulus: function ()
        {
            synthL.triggerAttack('A3');
            
            return `<p>You should hear this tone in your LEFT ear.</p>`
        },
        choices: ["Yep, left"],
    });    

    timeline.push( cleanup );
    timeline.push( pause );
    
    timeline.push({
        type: HTMLButtonResponsePlugin,
        stimulus: function ()
        {
            synthR.triggerAttack('E3');
            
            return `<p>You should hear this tone in your RIGHT ear.</p>`
        },
        choices: ["That's right"],
    });    

    timeline.push( cleanup );
    timeline.push( pause );
    
    timeline.push({
        type: HTMLButtonResponsePlugin,
        stimulus: `<p>Ok, you should be good to go.</p>`,
        choices: ["Finish"],
    });
    
    timeline.push(...spots_finish());
    
    timeline.push( goto_url(RETURN_PAGE) );
    await jsPsych.run(timeline);
}
