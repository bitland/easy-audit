#!/usr/bin/env node

var program = require('commander'),
    fs = require('fs');

var Config = require('./lib/config').Config,
    Liabilities = require('./lib/liabilities').Liabilities,
    Assets = require('./lib/assets').Assets;

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version)
  .usage('<action>')
  .option('-v, --verbose', 'Output debugging information.', Config.defaults.verbose)
  .option('--currency <currency>', 'Specify a currency code.', Config.defaults.currency);


program
  .command('audit <liabilities> <assets>')
  .description('Create an audit report based on data supplied by an exchange')
  .action(function () {
    var config = Config.fromProgram(program);

    var liabilities = Liabilities.fromFile(program.args[0], config);
    var assets = Assets.fromFile(program.args[1], config);

    console.log("ASSET OWNER:", assets.getOwner());
    console.log("BLOCK HEIGHT:", assets.getBlockHeight());

    assets.verifySignatures();

    var root = liabilities.calculateRoot();
    console.log("ROOT HASH:", root);

    var totalLiabilities = liabilities.getTotal();
    var totalAssets = assets.getTotal();

    if (config.verbose) {
      process.stderr.write("Total liabilities: "+totalLiabilities.toString()+"\n");
      process.stderr.write("Total assets:      "+totalAssets.toString()+"\n");
    }

    var ratio = totalAssets.div(totalLiabilities).times(100).toFixed(2);
    console.log("RESERVE RATIO:", ratio+"%");

    process.exit(0);
  });

program.parse(process.argv);
program.help();
