/**
 * @title contrast
 * @description contrast ration estimation using a slider
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HTMLKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import CanvasSliderResponsePlugin from "@jspsych/plugin-canvas-slider-response";

import { saveAs } from 'file-saver';
import chroma from 'chroma-js';

// local shared code
import { spots_setup, spots_finish, multi_dataset_chart, goto_url } from './shared/experimenta.js';

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
    
    const [ ROWS, COLUMNS ] = [ 5, 5 ];
    
    const [ GREY_REPS, COLOUR_REPS ] = QUICK_TEST ? [ 5, 5 ] : [ 30, 70 ];
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,

        `<p>In this experiment you are asked to estimate the<br>
        <b>contrast ratio</b> of two colours.</p>
        <p>Contrast ratio is symmetrical — it doesn't matter<br>
        which colour is foreground and which background.<br>
        It ranges from <b>1</b> (identical) to <b>21</b> (black vs white),<br>
        but is not distributed evenly — high values are rare.
        </p>
        `,
        
        `<p>For each trial, use the slider to estimate the contrast ratio.<br>
        You will be shown some calibration examples first,<br>
        but don't worry too much about the numbers.<br>
        Focus on your overall <b>perception</b> of the contrast.<br>
        This will probably deviate from the true ratio.</p>
        `,

        `<p>There are 100 trials in this experiment and it will take a few<br>
        minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry<br>
        about occasional errors and uncertainty.
        <b>This is not a test!</b></p>
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
        type: CanvasSliderResponsePlugin,
        stimulus: function(canvas)
        {
            let ctx = canvas.getContext("2d");
            
            let fg = jsPsych.timelineVariable('fg');
            let bg = jsPsych.timelineVariable('bg');
            
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            let column_width = canvas.width / COLUMNS;
            let row_height = canvas.height / ROWS;
            
            ctx.fillStyle = fg;
            
            for ( let column = 0; column < COLUMNS; ++column )
            {
                for ( let row = column % 2; row < ROWS; row += 2 )
                {
                    ctx.fillRect( column * column_width, row * row_height, column_width, row_height );
                }
            }
        },
        min: 10,
        max: 210,
        slider_start: jsPsych.timelineVariable('start'),
        slider_width: 600,
        prompt: jsPsych.timelineVariable('preamble'),
        data: {
            fg: jsPsych.timelineVariable('fg'),
            bg: jsPsych.timelineVariable('bg'),
            ratio: jsPsych.timelineVariable('ratio'),
            task: jsPsych.timelineVariable('task'),
            group: jsPsych.timelineVariable('group'),
        },
    };
    
    // calibration examples (hi, lo are luminances)
    // CR = (hi + 0.05)/(lo + 0.05)
    //
    // CR = 11 examples:
    //   lo = 0 -> hi = (11 * 0.05) - 0.05 = 0.5
    //   hi = 1 -> lo = (0.5/11)
    let hi_11 = chroma('#fff').luminance(0.5).hex();
    let lo_11 = chroma('#fff').luminance(0.5/11).hex();
    
    // CR = 4.5 examples:
    //   lo = 0 -> hi = (4.5 * 0.05) - 0.05 = 0.175
    //   hi = 1 -> lo = (1.05 - 4.5 * 0.05)/4.5 = 0.18333'
    let hi_45 = chroma('#fff').luminance(0.175).hex();
    let lo_45 = chroma('#fff').luminance((1.05 - 4.5 * 0.05)/4.5).hex();
    
    const preamble_vars = [
        { preamble: `<h2>Example: this combination has a contrast ratio of 21</h2>
                     <p>This is the highest possible value</p>`,
          fg: '#000', bg: '#fff', ratio: 21.0, start: 210, task: 'example'  },
        { preamble: `<h2>Example: this (invisible) combination has a contrast ratio of 1</h2>
                     <p>This is the lowest possible value</p>`,
          fg: '#888', bg: '#888', ratio: 1.0, start: 10, task: 'example' },
        { preamble: `<h2>Example: this combination has a contrast ratio of 11</h2>
                     <p>Note that the middle of the value range is pretty high contrast</p>`,
          fg: hi_11, bg: '#000', ratio: 11.0, start: 110, task: 'example'  },
        { preamble: `<h2>Example: this combination <i>also</i> has a contrast ratio of 11</h2>
                     <p>Note that the middle of the value range is pretty high contrast</p>`,
          fg: lo_11, bg: '#fff', ratio: 11.0, start: 110, task: 'example'  },
        { preamble: `<h2>Example: this combination has a contrast ratio of 4.5</h2>
                     <p>4.5 is the recommended minimum contrast ratio for accessible web pages</p>`,
          fg: hi_45, bg: '#000', ratio: 4.5, start: 45, task: 'example'  },
        { preamble: `<h2>Example: this combination <i>also</i> has a contrast ratio of 4.5</h2>
                     <p>4.5 is the recommended minimum contrast ratio for accessible web pages</p>`,
          fg: lo_45, bg: '#fff', ratio: 4.5, start: 45, task: 'example'  },
    ];

    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: preamble_vars,
    });
    
    timeline.push({
        type: HTMLKeyboardResponsePlugin,
        stimulus: `<p>The first round of trials will present only<br>
                   <b>greyscale</b> levels for estimation</p>
                   <p>Press any key to continue</p>`,
    });
    
    let grey_vars = [];
    for ( let ii = 0; ii < GREY_REPS; ++ii )
    {
        let bg = chroma('#fff').luminance(Math.random());
        let fg = chroma('#fff').luminance(Math.random());
        let ratio = chroma.contrast(bg, fg);
        
        grey_vars.push({ bg: bg.hex(), fg: fg.hex(), ratio: ratio, start: 110, task: 'response', group: 'Grey'  });
    }
    
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: grey_vars,
    });

    timeline.push({
        type: HTMLKeyboardResponsePlugin,
        stimulus: `<p>For the remaining trials the combinations<br>
                   presented will be in full colour. You may find<br>
                   these harder to estimate because the colour<br>
                   presents a confounding factor.</p>
                   <p>Press any key to continue</p>`,
    });
    
    let colour_vars = [];
    for ( let ii = 0; ii < COLOUR_REPS; ++ii )
    {
        let bg = chroma.random();
        let fg = chroma.random();
        let ratio = chroma.contrast(bg, fg);
        
        colour_vars.push({ bg: bg.hex(), fg: fg.hex(), ratio: ratio, start: 110, task: 'response', group: 'Colour' });
    }
    
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: colour_vars,
    });


    timeline.push(...spots_finish());
    timeline.push( multi_dataset_chart (jsPsych, [ 'Grey', 'Colour' ],
        {
            download_name: 'comp160_lab2_contrast.csv',
            stim_name: 'ratio',
            blurb: 'The chart below plots your estimate vs the true contrast ratio.',
            columns: [ 'rt', 'bg', 'fg', 'ratio', 'response', 'time_elapsed', 'group' ],
            xlab: 'True Contrast Ratio',
            ylab: 'Estimate',
            factor: 0.1,
        }));
    timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
