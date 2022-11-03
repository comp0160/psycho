/**
 * @title stereo
 * @description left-right spatial localisation test
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import AudioSliderResponsePlugin from "@jspsych/plugin-audio-slider-response";
import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

// local shared code
import { spots_setup, spots_finish, single_dataset_chart, goto_url } from './shared/experimenta.js';

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
        type: AudioButtonResponsePlugin,
        stimulus: 'assets/audio/silence.mp3',
        prompt:
        `<p>Some browsers prevent audio playback without user<br>
        interaction. Please click the button to ensure sounds<br>
        can be played.</p>`,
        choices: ['Allow Audio']
    });
    
    // build list of available stimuli
    const EXT = '.m4a';
    const PREFIX = 'assets/audio/';
    const SOUNDS = [ 'plain', 'barrel', 'dobro' ];

    let stimuli = [];    
    for ( let pos = -100; pos <= 100; pos += 10 )
    {
        const side = ( pos < 0 ) ? 'L' : ( pos > 0 ) ? 'R' : 'C';
        
        for ( let sound of SOUNDS )
        {
            let name = sound + '-' + side + String(Math.abs(pos)).padStart(3, '0') + EXT;
            stimuli.push({
                stimulus: PREFIX + name,
                pos: pos,
                sound: sound,
            });
        }
    }
    
    if ( QUICK_TEST )
    {
        stimuli =  jsPsych.randomization.sampleWithoutReplacement(stimuli, QUICK_TRIALS);
    }
    
    let single_trial =
    {
        type: AudioSliderResponsePlugin,
        stimulus: jsPsych.timelineVariable('stimulus'),
        min: -100,
        max: 100,
        slider_start: 0,
        slider_width: 600,
        
        data:
        {
            pos: jsPsych.timelineVariable('pos'),
            sound: jsPsych.timelineVariable('sound'),
            task: 'response'
        },
    };

    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: stimuli,
        randomize_order: true
    });

    timeline.push(...spots_finish());

    timeline.push( single_dataset_chart (jsPsych, stimuli,
        {
            download_name: 'comp160_lab3_stereo.csv',
            stim_name: 'pos',
            blurb: 'The chart below plots your estimate vs the true position.',
            columns: [ 'rt', 'pos', 'sound', 'response', 'time_elapsed' ],
            xlab: 'True Position',
            ylab: 'Estimate',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );
    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
