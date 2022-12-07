/**
 * @title legibility
 * @description text UI readability rating
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HTMLSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HTMLKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

import { saveAs } from 'file-saver';
import chroma from 'chroma-js';

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
    
    const REPS = QUICK_TEST ? 5 : 100;
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,

        `<p>In this experiment you are asked to rate the<br>
         <b>legibility</b> of some coloured text.</p>
        `,
        
        `<p>For each trial, use the slider to classify<br>
        the legibility on a five-point ordinal scale:</p>
        <p><b>Terrible</b> | <b>Poor</b> | <b>Okay</b> | <b>Good</b> | <b>Perfect</b></p>
        `,

        `<p>There are 100 trials in this experiment and it will take a few<br>
        minutes to complete.</p>
        <p>Try to focus on the experiment and give your honest opinion.<br>
        This is a subjective assessment, so there is no "right" answer.</p>
        `,

        `<p>NB: data from this experiment is collected only in memory in this<br>
        browser on your own computer. It will not be reported elsewhere and no<br>
        personally identifying information is stored.</p>
        <p>At the end of the experiment you will be given the opportunity to save the<br>
        results to a CSV file for further analysis if you wish. This is not mandatory.<br>
        If you choose not to do so, the data cannot be recovered later.<br>
        But you can always run the experiment again to obtain new data.</p>
        `,
    ];

    const [ jsPsych, timeline ] = spots_setup ( instructions );
    
    const single_trial =
    {
        type: HTMLSliderResponsePlugin,
        stimulus: function(c)
        {
            let fg = jsPsych.timelineVariable('fg');
            let bg = jsPsych.timelineVariable('bg');
            let preamble = jsPsych.timelineVariable('preamble');
            
            if ( ! preamble )
            {
                preamble = '';
            }
            
            return `${preamble}
                    <div style="background-color: ${bg}; color: ${fg}; padding:100px; margin:3% 10%;">
                    <h1 style="border: 2px solid ${fg}; padding: 10px;">FUGIAT NULLA PARIATUR</h1>
                    <h2>Aliquip ex ea commodo</h2>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                    sed do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit
                    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                    occaecat cupidatat non proident, sunt in culpa qui officia
                    deserunt mollit anim id est laborum.</p>
                    </div>`;
        },
        min: 1,
        max: 5,
        labels: ['Terrible', 'Poor', 'Okay', 'Good', 'Perfect'],
        slider_start: 3,
        slider_width: 400,
        data: {
            fg: jsPsych.timelineVariable('fg'),
            bg: jsPsych.timelineVariable('bg'),
            ratio: jsPsych.timelineVariable('ratio'),
            task: 'response',
        },
    };
        
    let colour_vars = [];
    for ( let ii = 0; ii < REPS; ++ii )
    {
        let bg = chroma.random();
        let fg = chroma.random();
        let ratio = chroma.contrast(bg, fg);
        
        colour_vars.push({ bg: bg.hex(), fg: fg.hex(), ratio: ratio });
    }
    
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: colour_vars,
    });


    timeline.push(...spots_finish());
    timeline.push( simple_scatter (jsPsych,
        {
            download_name: 'comp160_lab2_legibility.csv',
            stim_name: 'ratio',
            blurb: 'The chart below plots legibility vs contrast ratio.',
            columns: [ 'rt', 'bg', 'fg', 'ratio', 'response', 'time_elapsed' ],
            xlab: 'Contrast Ratio',
            ylab: 'Legibility Rating',
            factor: 1,
        }));
    //timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
