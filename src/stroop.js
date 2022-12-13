/**
 * @title Stroop Test
 * @description Stroop test of semantic interference between words and colours
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";


// local shared code
import { single_spot, spots_setup, spots_finish, single_dataset_chart, goto_url } from './shared/experimenta.js';

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
    
    // various bits of test content
    const COLOURS = [ '#ff2a60', '#eae813', '#8a25d8' ];
    const COLOUR_NAMES = [ 'red', 'yellow', 'purple' ];
    const ARROWS = [ 'LEFT ⬅️', 'UP ⬆️', 'RIGHT ➡️' ];
    const CHOICES = [ 'arrowleft', 'arrowup', 'arrowright' ];
    const CHINESE_COLOUR_NAMES = [ '朱红', '黄', '紫' ];
    const EXTRA_COLOUR_NAMES = [ 'blue', 'green', 'brown' ];
    const OTHER_WORDS = [ 'aardvark', 'piano', 'football', 'chapel', 'lizard',
                          'sandwich', 'carousel', 'spaceship', 'triangle', 'kazoo',
                          'laboratory', 'migraine', 'water', 'cardamom', 'picture' ];
    
    const REPS = QUICK_TEST ? 1 : 5;
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,

        `<p>This experiment investigates the
        <a href="https://en.wikipedia.org/wiki/Stroop_effect">Stroop Effect</a><br>
        of <i>semantic interference</i> between different pathways in<br>
        the processing of visual information.</p>
        <p>You will be shown a sequence of single words,<br>
        shown in coloured text. You are asked to identify<br>
        what colour each word is by pressing the arrow keys<br>
        on your keyboard.</p>
        `,

        `<p>There are about 100 trials in this experiment and it<br>
        will take a few minutes to complete.<p>
        This is a <b>reaction time</b> test, so try to make your choice<br>
        as quickly as you can.</p>
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
    
    // prelim phase: introduce the colours and keys
    const congruent = []
    for ( let ii = 0; ii < COLOURS.length; ++ii )
    {
        congruent.push( { colour : COLOURS[ii], name: COLOUR_NAMES[ii], arrow: ARROWS[ii] });
    }
    
    if (! QUICK_TEST)
    {
        const prelim_single =
        {
            type: HtmlKeyboardResponsePlugin,
            stimulus: function ()
            {
                let col = jsPsych.timelineVariable('colour');
                let name = jsPsych.timelineVariable('name');
                let arrow = jsPsych.timelineVariable('arrow');
            
                return `<p style="color: ${col}; font-size: 400%; font-weight: bold">${name}</p>
                        <p>This colour is <b>${name}</b>.<br>
                        When you see this colour press the ${arrow} arrow key</p>`
            },
            choices: CHOICES,
            post_trial_gap: 1500,
        };
    
        const prelims =
        {
            timeline: [ prelim_single ],
            timeline_variables: congruent
        }

        timeline.push(prelims);
    }
    
    const prelim_summary =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function ()
        {
            var combo = '<h2>Summary</h2><div style="display: flex; flex-direction: row;">'
            
            for ( let col of congruent )
            {
                combo +=
                
                `<div style="width: 10em; margin: 1em;"><p style="color: ${col.colour}; font-size: 200%; font-weight: bold">${col.name}</p>
                 <p>${col.arrow}</p>
                 </div>`;
            }
            
            combo += '</div><p>Press any key to begin</p>';
            
            return combo
        },
        
        post_trial_gap: 2000,
    }
    
    timeline.push(prelim_summary);
    
    // phase 1: train on neutral words
    const single_trial =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function ()
        {
            let col = jsPsych.timelineVariable('colour');
            let word = jsPsych.timelineVariable('word');
            
            return `<p style="color: ${col}; font-size: 400%; font-weight: bold">${word}</p>`
        },
        data:
        {
            task: 'response',
            target: jsPsych.timelineVariable('target'),
            colour: jsPsych.timelineVariable('colour'),
            idx: jsPsych.timelineVariable('idx'),
            word: jsPsych.timelineVariable('word'),
            congruence: jsPsych.timelineVariable('congruence'),
            correct_response: jsPsych.timelineVariable('correct_response'),
        },  
        choices: CHOICES,
        post_trial_gap: 1500,        
    }
    
    const neutrals = [];
    const n_neutral = QUICK_TEST ? 3 : OTHER_WORDS.length;
    const shuffled_others = jsPsych.randomization.sampleWithoutReplacement(OTHER_WORDS, n_neutral)
    
    for ( let ii = 0; ii < n_neutral; ++ii )
    {
        let idx = Math.floor(Math.random() * COLOURS.length);
        neutrals.push({
            idx: idx,
            colour: COLOURS[idx],
            word: shuffled_others[ii],
            congruence: 'neutral',
            target: 'colour',
            correct_response: CHOICES[ii],
        } );
    }
    
    timeline.push({ timeline: [ single_trial ], timeline_variables: neutrals });
    
    // phase 2: test with colour names
    const english = [];
    for ( let ii = 0; ii < COLOURS.length; ++ii )
    {
        for ( let jj = 0; jj < COLOURS.length; ++jj )
        {
            english.push({
                idx: ii,
                colour: COLOURS[ii],
                word: COLOUR_NAMES[jj],
                congruence: (ii==jj) ? 'congruent' : 'incongruent',
                target: 'colour',
                correct_response: CHOICES[ii],
            });
        }
    }
    
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: english,
        randomize_order: true,
        repetitions: REPS
    });
    
    // TODO, maybe: add non-english words and extraneous colour names
    
    // task change: recognise name rather than text colour
    timeline.push({
        type: HtmlKeyboardResponsePlugin,
        stimulus:
            `<h2>New Task</h2>
            <p>For the remaining trials, you now have a different task:<br>
            instead of reporting the colour of the text, instead<br>
            you should report the <b>named</b> colour.</p>`,
        post_trial_gap: 1500,
    })
    
    if (! QUICK_TEST)
    {
        const retask_single =
        {
            type: HtmlKeyboardResponsePlugin,
            stimulus: function ()
            {
                let name = jsPsych.timelineVariable('name');
                let arrow = jsPsych.timelineVariable('arrow');
            
                return `<p style="color: #888; font-size: 400%; font-weight: bold">${name}</p>
                        <p>When you see this <b>word</b> press the ${arrow} arrow key</p>`
            },
            choices: CHOICES,
            post_trial_gap: 1500,
        };
    
        const retasks =
        {
            timeline: [ retask_single ],
            timeline_variables: congruent
        }

        timeline.push(retasks);
    }
    
    const retask_summary =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function ()
        {
            var combo = '<h2>Summary</h2><div style="display: flex; flex-direction: row;">'
            
            for ( let col of congruent )
            {
                combo +=
                
                `<div style="width: 10em; margin: 1em;"><p style="color: #888; font-size: 200%; font-weight: bold">${col.name}</p>
                 <p>${col.arrow}</p>
                 </div>`;
            }
            
            combo += '</div><p>Press any key to begin</p>';
            
            return combo
        },
        
        post_trial_gap: 2000,
    }
    
    timeline.push(retask_summary);
    
    // TODO: restructure to avoid the annoying duplication here
    const english_word = [];
    for ( let ii = 0; ii < COLOURS.length; ++ii )
    {
        for ( let jj = 0; jj < COLOURS.length; ++jj )
        {
            english_word.push({
                idx: ii,
                colour: COLOURS[ii],
                word: COLOUR_NAMES[jj],
                congruence: (ii==jj) ? 'congruent' : 'incongruent',
                target: 'word',
                correct_response: CHOICES[jj],
            });
        }
    }

    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: english_word,
        randomize_order: true,
        repetitions: REPS
    });
    
    timeline.push(...spots_finish());
    
    // columns = [ 'rt', 'colour', 'idx', 'word', 'congruence', 'target', 'response', 'correct_response', 'time_elapsed' ]
    
    //timeline.push( single_dataset_chart(jsPsych, colours, {download_name: 'comp160_lab2_stroop.csv'}) );
    timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
