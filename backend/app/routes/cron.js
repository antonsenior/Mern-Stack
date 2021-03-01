const mongoose = require('mongoose');
const Reports = mongoose.model('reports');
const Display = mongoose.model('Display');
const ReportHistory = mongoose.model('ReportHistory');
const Customer = mongoose.model('Customer');
const Images = mongoose.model('Image');
const Clusters = mongoose.model('Cluster');
const ResourceHistories = mongoose.model('ResourceHistory');
const Promise = require('bluebird');
const CronJob = require('cron').CronJob;

module.exports.setRouter = (app) => {

  let EKey = "Fail";
  let WKey = "Warn";
  let PKey = "Pass";
  let IKey = "Info";
  let SKey = "Score";


  let sEKey = "fail";
  let sWKey = "warn";
  let sPKey = "pass";
  let sIKey = "info";
  let sSKey = "score";
  let sFkey = "field";

  let maxWorkloads = -1; // use -1 for all

  let TimstampFormat = (time) => {
    if(time.length === 0){ return; }
    let date  = new Date(time);
    return `${date.toLocaleString('default', { month: 'short' })} ${date.toLocaleString('default', { day:'numeric' })}` ;
  };



  // "1. In report table, for each cluster, find row with report_type=workload_compliance and obtain json for workload ""all"" from summary_json field. This json looks like: {all: {E : value, W: value, I: value}} 
  // 2. In display table, save a row for each cluster with display_item=WorkloadVulnSummary and display_item_value={E, W} using values from step 1
  // 3. Calculate sum of E (=> All_Cluster_Error) and sum of W for all clusters (All_Cluster_Warn)
  // 4. In display table, save another row for display_item=WorkloadVulnSummary for cluster_name=all with display_item_value={All_Cluster_Error, All_Cluster_Warn}
  // 5. Also save above value in report_history table for cluster_name=all as a new row - with current time as timestamp, report_type=workload_compliance and summary_json looking like {all: {E: All_Cluster_Error, W: All_Cluster_Warn}}"

  let insertDisplayInfoForSingleCustomer = (customer_id) => {

    return new Promise( async (resolve, reject) => {

      try{

        let reports      = await Reports.find({ report_type: 'workload_compliance', customer_id }).exec();
        let cError       = 0;
        let cWarn        = 0;
        let displayArray = [];

        reports.forEach((row) => {
          // Process sinle row 
          if( row['summary_json'] ){
            try{
              let record = JSON.parse( row['summary_json'] )["all"] || {};            
              let value  = {};
              if(typeof(record.E) !== 'undefined'){
                value[EKey] = record.E;
                cError    += parseFloat(record.E) || 0;
              }
              if(typeof(record.W) !== 'undefined'){
                value[WKey] = record.W;
                cWarn     += parseFloat(record.W) || 0;
              }
              displayArray.push({ 
                display_item : 'WorkloadVulnSummary', 
                cluster_name : row['cluster_name'], 
                customer_id  : row['customer_id'],
                display_item_value : JSON.stringify(value)
              });
            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        displayArray.push({ 
          display_item : 'WorkloadVulnSummary', 
          cluster_name : 'all', 
          customer_id,
          display_item_value :JSON.stringify({
            [EKey] : cError,
            [WKey] : cWarn
          })
        });

        // TODO: Make both of run at the same time.
  
        // Saving Display Date
        await Promise.all([
          await Promise.map(displayArray, function(row) {
            return Display.findOneAndUpdate({ // Where
              display_item: row['display_item'],
              cluster_name: row['cluster_name'],
              customer_id: row['customer_id'],
            }, row, { // Option
              upsert: true
            }).exec();
          }),
          await ReportHistory.findOneAndUpdate({
            cluster_name : 'all',
            report_type  : 'workload_compliance',
            timestamp    : new Date(),
            customer_id,
          },{
            'summary_json' : JSON.stringify({
              all : {
                F: cError, // F and E are same
                W: cWarn
              }
            })
          },{
            upsert: true
          }).exec()

        ]); 

        resolve();
      }catch(e){
        reject(e);
      }
    });
  }; // end of addCustomer

  // "1. Read report table and find rows with report_type=workload_complianc eand. From the summary_json of these rows, obtain workload names and values for E and W. prepare sorted list of vulnerable worloads for each cluster and also another sorted list for ""all"" clusters. Sorting is done based on value of E (Error/Fai)l and then based on value of W (Warn). Limit each list to no more than maxWorkloads items

  // 2. In display table, update/insert rows for each cluster for display_item=TopVulnWorkload with display_item_value as {{""workload1"", ""cluster1"", {fail1, warn1} }, {""workload2"", ""cluster1, {fail2, warn2}},{""workload3"", ""cluster1"", {fail3, warn3} ...} For each cluster, the cluster values inside the display_item_value  will be the same. 

  // 3. In display table, for cluster_name=all, update/insert a row for display_item=TopVulnWorkload with display_item_value as {{""workload1"", ""cluster1"", {fail1, warn1} }, {""workload2"", ""cluster1, {fail2, warn2}},{""workload3"", ""cluster2"", {fail3, warn3} ...} For ""all"" clusters, the cluster values will differ."

  let insertReportInfoForSingleCustomer = (customer_id) => {
    return new Promise( async (resolve, reject) => {
      try{
       
        let reports        = await Reports.find({ report_type :'workload_compliance', customer_id }).exec();
        let clusterInfo    = {};
        let allClusterInfo = [];

        // Using smaller Ekey

        function sort(param){
          param.sort((a, b) => {     
            if (a[sEKey] === b[sEKey]) {
              return b[sWKey] - a[sWKey];
            }
            return b[sEKey] > a[sEKey] ? 1 : -1;
          });
        }


        reports.forEach((row) => {
          // Process sinle row 
          if( row['summary_json'] ){
            try{

              let info        = [];
              let clusterName = row['cluster_name'];
              let summaryJson = JSON.parse(row['summary_json']);

              for(let workload in summaryJson){
                  
                  // Excel correction
                  if(workload === 'all' ){
                    continue;
                  }
                 
                  let record  = summaryJson[workload] || {};            
                  let result  = {};
                  if(typeof(record.E) !== 'undefined'){
                    result[sEKey] = record.E;
                  }
                  if(typeof(record.W) !== 'undefined'){
                    result[sWKey] = record.W;
                  }

                  info.push({
                    workload,
                    cluster_name: row['cluster_name'],
                    ...result                    
                  });

              }

              if(typeof(clusterInfo[clusterName]) === "undefined"){
                clusterInfo[clusterName] = [];
              }
           
              // Timstamp is missing, hence usinge created_at
              clusterInfo[clusterName] = clusterInfo[clusterName].concat(info);
            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });
   
        // Sorting and limiting to `maxWorkloads` elements

        for(let cName in clusterInfo){
          sort(clusterInfo[cName]);
          allClusterInfo = allClusterInfo.concat(clusterInfo[cName]);

          if(maxWorkloads !== -1 && clusterInfo[cName].length > maxWorkloads){
            clusterInfo[cName] = clusterInfo[cName].slice(0, maxWorkloads);
          }
        }
        sort(allClusterInfo);
        if(maxWorkloads !== -1 && allClusterInfo.length > maxWorkloads){
          allClusterInfo = allClusterInfo.slice(0, maxWorkloads);
        }   

        let keyArray = Object.keys(clusterInfo);
      
        await Promise.all([
          Promise.map(keyArray, function(key) {
            return Display.findOneAndUpdate({ // WHERE
              display_item: 'TopVulnWorkload',
              cluster_name: key,
              customer_id              
            },{ // Update
              'display_item_value' : JSON.stringify( clusterInfo[key] )
            }, { // Options
              upsert: true
            }).exec();
          }),
          Display.findOneAndUpdate({ // WHERE
            display_item: 'TopVulnWorkload',
            cluster_name: 'all',
            customer_id              
          },{ // Update
            'display_item_value' : JSON.stringify( allClusterInfo )
          }, { // Options
            upsert: true
          }).exec()
        ]); 
        resolve();
      }catch(e){
        reject(e);
      }
    });
  }; // end of addCustomer

  // "1. Read report_history table's summary_json field for report_type=workload_compliance for each cluster and for cluster_name=all. From the summary_json, obtain E and W values for workload ""all"". This section of the json looks like: {all: {E : value, W: value, I: value}} 

  // 2. For all timestamps within the ""max_duration"" configured (1 month?), obtain timestamp and {E, W} values (from step above) and save into a map {timestamp1: {E1, W1}, timestamp2: {El2, W2}...}

  // 3. In table DIsplay, save above map as display_item_value in new row with display_item=WorkloadVulnTrend for each cluster. Similarly, save map for cluster_name=all in another Display table row for display_item=WorkloadVulnTrend"

  // TODO: ask cluster name "all" save data 

  let insertReportHistoryInfoForSingleCustomer = (customer_id) => {

    return new Promise( async (resolve, reject) => {

      try{

        let today = new Date();

        // TODO: Make maxDuration work with created_at
        let reports = await ReportHistory.find({
          report_type : 'workload_compliance',
          timestamp   : { $gte: today.setMonth(today.getMonth() - 3) },
          customer_id
        }).exec();

        let clusterInfo  = {};
        let maxDuration  = '1 month';

        reports.forEach( (row) => {

          // Process sinle row 
          if( row['summary_json'] ){
            try{

              let parsedJson  = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let record      = parsedJson["all"] || {};            
              let value       = {};
              let clusterName = row['cluster_name'];
              value[sFkey]    = TimstampFormat(typeof(row['timestamp'] !== 'undefined')?row['timestamp']:'');

              if(typeof(record.E) !== 'undefined'){
                value[sEKey] = record.E;
              }
              if(typeof(record.W) !== 'undefined'){
                value[sWKey] = record.W;
              }

              if(typeof(clusterInfo[clusterName]) === "undefined"){
                clusterInfo[clusterName] = [];
              }
               
              clusterInfo[clusterName].push(value);
            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        // Saving in Database
        let keyArray = Object.keys(clusterInfo);
        Promise.map(keyArray, function(clusterN) {
          return Display.findOneAndUpdate({ // WHERE
            display_item: 'WorkloadVulnTrend',
            cluster_name: clusterN,
            customer_id              
          },{ // Update
            'display_item_value' : JSON.stringify( clusterInfo[clusterN] )
          },{ // Options
            upsert: true
          }).exec();
        });        

        
        // await Promise.map(allCluster, function(key) {
        //   let keyArray = Object.keys(key);
        //   Promise.map(keyArray, function(clusterN,value) {
        //     return Display.findOneAndUpdate({ // WHERE
        //       display_item: 'WorkloadVulnTrend',
        //       cluster_name: clusterN,
        //       customer_id              
        //     },{ // Update
        //       'display_item_value' : JSON.stringify( key[clusterN] )
        //     },{ // Options
        //       upsert: true
        //     }).exec();
        //   });
        // });
        resolve();
      }catch(e){
        reject(e);
      }
    });
  }; // end of addCustomer



  // ClusterVulnSummary  cust, cluster (name | all)  "{""Score"" : 34, ""Pass"": 44"", ""Fail"" 45, 
  // ""Warn"":145, ""Info"": 345}" 

  // "1. In report table, for each cluster, find row with report_type=cluster_compliance and obtain json with {""Pass"": 44"", ""Fail"" 45, ""Warn"":145, ""Info"": 345}  from summary_json field

  // 2. Calculate Score as Pass/(Pass+Fail+Warn+Info) * 100

  // 3. In display table, save a row for display_item=ClusterVulnSummary for each cluster with display_item_value={Score, Pass, Fail, Warn and Info}

  // 4. Calculate aggregate values across all clusters for Pass, Fail, Warn, Info. Then calculate All_Cluster_Score as All_Cluster_Pass/(All_Cluster_Pass+All_Cluster_Fail+All_Cluster_Warn+All_Cluster_Info) * 100

  // 5. In display table, save a row for display_item=ClusterVulnSummary for cluster_name=all with display_item_value={All_Cluster_Score,All_Cluster_ Pass,All_Cluster_Fail, All_Cluster_Warn and All_Cluster_Info}

  // 6.  Also save above value in report_history table for cluster_name=all as a new row - with current time as timestamp, report_type=cluster_compliance and summary_json looking like {all: {""Score"" : 34, ""Pass"": 44"", ""Fail"" 45, ""Warn"":145, ""Info"": 345}}"


  let insertClusterVulnSummary = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{
        let reports        = await Reports.find({ report_type :'cluster_compliance', customer_id }).exec();
        let clusterInfo    = {};
        let allClusterInfo = [];
        let timestamp = '';

        let tP = 0;
        let tF = 0;
        let tW = 0;
        let tI = 0;
        let tS = 0;
        let dT = 0; // Division Total

        reports.forEach( (row) => {
          if( row['summary_json'] ){
            try{
              let parsedJson = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let record     = parsedJson["All"] || {};            
              let value      = {};
              let pass       = 0;
              let fail       = 0;
              let warn       = 0;
              let info       = 0;
              let total      = 0;


              if(typeof(record.P) !== 'undefined'){
                value[sPKey] = pass = parseFloat(record.P) || 0;
                tP += pass;
              }
              if(typeof(record.F) !== 'undefined'){
                value[sEKey] = fail = parseFloat(record.F) || 0;
                tF += fail;
              }
              if(typeof(record.I) !== 'undefined'){
                value[sIKey] = info = parseFloat(record.I) || 0;
                tI += info;
              }
              if(typeof(record.W) !== 'undefined'){
                value[sWKey] = warn = parseFloat(record.W) || 0;
                tW += warn;
              }

              total = pass+fail+warn+info;

             
             // TODO: Ask Huseni, what to value to place for 0/0
             // Right now saving 0
              value[sSKey] =  total !== 0 ?  pass/(total)*100 : 0;

              // What if customer name and clustername exist multiple time ??
              clusterInfo[row['cluster_name']] = value;
              // tS += value.Score;

            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        dT = tP+tF+tW+tI;
        // TODO: Ask Huseni, what to value to place for 0/0
        // Right now saving 0
        tS = dT !== 0 ?  tP/(dT)*100 : 0;

        // Saving in Database

        // TODO: Name in task are like All_Cluster_Score,All_Cluster_Pass,All_Cluster_Fail, All_Cluster_Warn and All_Cluster_Info
        // I am using standard name

        let allObject = {
          [sSKey] : tS,
          [sPKey] : tP,
          [sEKey] : tF,
          [sWKey] : tW,
          [sIKey] : tI,
        };
        clusterInfo['all'] = allObject;

        let keyArray = Object.keys(clusterInfo);

        await Promise.map(keyArray, function(key) {
          return Display.findOneAndUpdate({ // WHERE
            display_item: 'ClusterVulnSummary',
            cluster_name: key,
            customer_id              
          },{ // Update
            'display_item_value' : JSON.stringify( clusterInfo[key] )
          },{ // Options
            upsert: true
          }).exec();
        });

        // Insert and Update History
        await ReportHistory.findOneAndUpdate({
          cluster_name : 'all',
          report_type  : 'cluster_compliance',
          timestamp    :  new Date(),
          customer_id
        },{
          summary_json : JSON.stringify({ all: allObject })
        },{
          upsert: true
        }).exec();          

        resolve();
      }catch(e){
        reject(e);
      }
    });

  }



  // TopVulnClusters cust, maxClusters {{"cluster1", {score1, pass1, fail1, warn1}}, {"cluster2", {score2, pass2, fail2, warn2}}…upto maxClusters {}}  "

  // 1. Read report table's summary_json for report_type=cluster_compliance and prepare sorted list of vulnerable clusters by calculating score=P*100/(P+F+W+I). Obtain P,F, W, I values from section on All Nodes, which looks like this inside summary_json: {""All"":{""P"":36,""F"":30,""W"":3,""I"":3}}. Lowest score cluster is most vulnerable and should be on top of list. Limit the list to no more than maxClusters items

  // 2. In display table, for ""all"" cluster, update/insert row for display_item=TopVulnClusters with display_item_value as {{""cluster1"", {score1, pass1, fail1, warn1}}, {""cluster2"", {score2, pass2, fail2, warn2}}, ...} 
  // "

  let insertTopVulnClusters = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{
        let reports        = await Reports.find({ report_type :'cluster_compliance', customer_id }).exec();
        let clusterInfo    = [];
        let allClusterInfo = [];

        let tP = 0;
        let tF = 0;
        let tW = 0;
        let tI = 0;
        let tS = 0;

        let maxClusters = -1;

        function sort(param){
          param.sort((a, b) => {          
            return a[sSKey] - b[sSKey];
          });
        }

        reports.forEach( (row) => {
          if( row['summary_json'] ){
            try{
              let parsedJson = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let record     = parsedJson["All"] || {};            
              let value      = {};

              let pass       = 0;
              let fail       = 0;
              let warn       = 0;
              let info       = 0;
              let total      = 0;

              value['cluster_name'] = row['cluster_name'];

              if(typeof(record.P) !== 'undefined'){
                value[sPKey] = pass = parseFloat(record.P) || 0;
                tP += pass;
              }
              if(typeof(record.F) !== 'undefined'){
                value[sEKey] = fail = parseFloat(record.F) || 0;
                tF += fail;
              }
              if(typeof(record.I) !== 'undefined'){
                value[sIKey] = info = parseFloat(record.I) || 0;
                tI += info;
              }
              if(typeof(record.W) !== 'undefined'){
                value[sWKey] = warn = parseFloat(record.W) || 0;
                tW += warn;
              }

              total = pass+fail+warn+info;

             
             // TODO: Ask Huseni, what to value to place for 0/0
             // Right now saving 0
              value[sSKey] =  total !== 0 ?  pass * 100 /(total) : 0;

              // This will only work for single cluster_name per client ID
              // I am not sure how to handle multiple row with same cluster_name and client_id

              clusterInfo.push(value);

              tS += value.Score;


            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        // Sorting records
        sort(clusterInfo);

        if(maxClusters !== -1 && clusterInfo.length > maxClusters){
          clusterInfo = clusterInfo.slice(0, maxClusters);
        }

        // TODO: Invalid JSON is given task, please confirm the correct JSON format with client.
        // I have added Info in the json saved into the DB, please confirm with Huseni about this.
        await Display.findOneAndUpdate({ // WHERE
          display_item: 'TopVulnClusters',
          cluster_name: 'all',
          customer_id              
        },{ // Update
          'display_item_value' : JSON.stringify( clusterInfo )
        },{ // Options
          upsert: true
        }).exec();

        resolve();
      }catch(e){
        reject(e);
      }
    });

  } 



  // ClusterScoreTrend cust, cluster "{starttime, endtime, interval, map:
  // {timestamp1: {score1},timestamp2: {score2}….{}}}" "

  // 1. Read report_history table's summary_json field for report_type=cluster_compliance for each cluster and for cluster_name=all. From the summary_json, obtain P, F, W, I values for node All.  This section of the summary_json looks like {""All"":{""P"":36,""F"":30,""W"":3,""I"":3}. Compute score = 100*P/(P+F+W+I)  


  // 2. For all timestamps within the ""max_duration"" configured (1 month?), obtain timestamp and {score} values from summary_json and save into a map {timestamp1: {score1}, timestamp2: {score2}...}


  // 3. Save above map as display_item_value into display table's display_item=ClusterScoreTrend, for each cluster. Similarly save map for cluster_name=all in another Display table row for display_item=ClusterScoreTrend"

  let insertClusterScoreTrend = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{

        let maxDuration = '1 month';

        let today = new Date();

        // TODO: Make created_at dynamic with maxDuration

        let reportsH = await ReportHistory.find({
          report_type : 'cluster_compliance',
          timestamp   : { $gte: today.setMonth(today.getMonth() - 3) },
          customer_id 
        }).exec();

        let clusterInfo = {};
        let pass = 0;
        let fail = 0;
        let warn = 0;
        let info = 0;

        reportsH.forEach( (row) => {
          if( row['summary_json'] ){
            try{

              let parsedJson  = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let record      = parsedJson["All"] || {};            
              let value       = {};

              let clusterName = row['cluster_name'];

              if(typeof(record.P) !== 'undefined'){
                pass = parseFloat(record.P) || 0;
              }
              if(typeof(record.F) !== 'undefined'){
                fail = parseFloat(record.F) || 0;
              }
              if(typeof(record.I) !== 'undefined'){
                info = parseFloat(record.I) || 0;
              }
              if(typeof(record.W) !== 'undefined'){
                warn = parseFloat(record.W) || 0;
              }

              total = pass+fail+warn+info;


              value[sFkey]  = TimstampFormat(typeof(row['timestamp'] !== 'undefined') ? row['timestamp']:'');

             // TODO: Ask Huseni, what to value to place for 0/0
             // Right now saving 0
              value[sSKey] =  total !== 0 ?  100*pass/(total) : 0;

              if(typeof(clusterInfo[clusterName]) === "undefined"){
                clusterInfo[clusterName] = [];
              }

           
              clusterInfo[clusterName].push(value);

            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        let keyArray = Object.keys(clusterInfo);
      
        // Saving in Database
        await Promise.map(keyArray, function(key) {
          return Display.findOneAndUpdate({ // WHERE
            display_item: 'ClusterScoreTrend',
            cluster_name: key,
            customer_id              
          },{ // Update
            'display_item_value' : JSON.stringify( clusterInfo[key] )
          },{ // Options
            upsert: true
          }).exec();
        });        

        resolve();
      }catch(e){
        reject(e);
      }
    });

  } 

  /*

    1. In report table, for each cluster find row with report_type=appcompliancereport and obtain severity_count json from summary_json field

    2. From the severity_count json {critical, high, medium, low, negligible, unknown}  find total  (total=critical+high+med+low_neg+unknown)

    3. In display table, save a row for display_item=ImgVulnSummary for each cluster with display_item_value= {total, critical, high, medium, negligible, unknown}.
    3b. Save above info {total, critical, high, medium, negligible, unknown} as summary_json and write to report_history table as new row with this cluster_id and report_type=app_compliance.

    4. In display table, save a row for cluster_name=all for display_item=ImgVulnSummary with display_item_value={sum_total, sum_critical,sum_ high, sum_medium, sum_negligible, sum_unknown}. Where sum is taken across all the clusters for that customer
    4b. Save above info {total, critical, high, medium, negligible, unknown} as summary_json and write to report_history table as new row with cluster_id=all and report_type=app_compliance.

  */

  let insertAppCornJobStep1 = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{

        // 1. In report table, for each cluster find row with report_type=app_compliance and obtain severity_count 
        // json from summary_json field

        let reports = await Reports.find({
          report_type :'app_compliance',
          customer_id 
        }).exec();
         
        let clusterInfo    = {};
        let allClusterInfo = {};

        let tC        = 0; // Total critical
        let tH        = 0; // Total high
        let tM        = 0; // Total medium
        let tL        = 0; // Total low
        let tN        = 0; // Total negligible         
        let tU        = 0; // Total unknown
        let total     = 0;   
        let timestamp = "";

        reports.forEach( (row) => {
          if( row['summary_json'] ){
            try{

              let critical   = 0;
              let high       = 0;
              let medium     = 0;
              let low        = 0;
              let negligible = 0;
              let unknown    = 0;                
                             
              let parsedJson  = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let record      = parsedJson["severity_count"] || {};            
              let value       = {};
              let clusterName = row['cluster_name'];

              // 2. From the severity_count json {critical, high, medium, low, negligible, unknown}  find 
              // total  (total=critical+high+med+low_neg+unknown)

              if(typeof(record.Critical) !== 'undefined'){
                value["critical"] = critical = parseFloat(record.Critical) || 0;
                tC += critical;
              }
              if(typeof(record.High) !== 'undefined'){
                value["high"] = high = parseFloat(record.High) || 0;
                tH += high;
              }
              if(typeof(record.Medium) !== 'undefined'){
                value["medium"] = medium = parseFloat(record.Medium) || 0;
                tM += medium;
              }
                // TODO: I am saving low.
              if(typeof(record.Low) !== 'undefined'){
                value["low"] = low = parseFloat(record.Low) || 0;
                tL += low;
              }
              if(typeof(record.Negligible) !== 'undefined'){
                value["negligible"] = negligible = parseFloat(record.Negligible) || 0;
                tN += negligible;
              }    
              if(typeof(record.Unknown) !== 'undefined'){
                value["unknown"] = unknown = parseFloat(record.Unknown) || 0;
                tU += unknown;
              }                                               

              value["total"] = critical+high+medium+low+negligible+unknown;
              total += value["total"];
              clusterInfo[clusterName]    = value;
              timestamp = typeof(row['timestamp'])=='undefined'?'':row['timestamp'];

            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        allClusterInfo['allT'] = {
          ["critical"]: tC,
          ["high"] : tH,
          ["medium"] : tM,
          //["low"] : tL,  // TODO: I am saving low.
          ["negligible"] : tN,
          ["unknown"] : tU,
          ["total"] : total
        };

        // Saving in Database

        // 3. In display table, save a row for display_item=ImgVulnSummary for each cluster with 
        // display_item_value= {total, critical, high, medium, negligible, unknown}.

        // 3b. Save above info {total, critical, high, medium, negligible, unknown} as summary_json 
        // and write to report_history table as new row with this cluster_id and report_type=app_compliance. && add `Time Stamp`

        // TODO: What is cluster_id ?? Is it same as cluster name ?

        // 4. In display table, save a row for cluster_name=all for display_item=ImgVulnSummary with 
        // display_item_value={sum_total, sum_critical,sum_ high, sum_medium, sum_negligible, sum_unknown}. 
        // Where sum is taken across all the clusters for that customer

        // TODO: Do we need to save all Info ? In previous point it is `sum_total` and in this below case it `total`.

        // New Entry with cluster_id = all
        // Changes are done below.
        // Each time add new row
        // 4b. `Save above info {sum_total, sum_critical,sum_ high, sum_medium, sum_negligible, sum_unknown}` as summary_json and 
        // write to report_history table as new row with cluster_id=all and report_type=app_compliance and add `Time stamp` ?


        // Changes discussed on call
        // 3b) Add timestamp
        // 4b) Add timestamp and save {sum_total, sum_critical,sum_ high, sum_medium, sum_negligible, sum_unknown}

        let keyArray = Object.keys(clusterInfo);
        await Promise.all([
          Promise.map(keyArray, function(key) {
            return Display.findOneAndUpdate({ // WHERE
              display_item: 'ImgVulnSummary',
              cluster_name: key,
              customer_id              
            },{ // Update
              'display_item_value' : JSON.stringify( clusterInfo[key] )
            },{ // Options
              upsert: true
            }).exec();
          }),

          await new ReportHistory({ 
            report_type    : 'app_compliance',
            cluster_name   : 'all',
            customer_id    : customer_id ,
            'timestamp'    : timestamp,
            'summary_json' : JSON.stringify( allClusterInfo['allT'] )
          }).save()       

        ]);

        resolve();
      }catch(e){
        reject(e);
      }
    });

  }

  /*
   *
   * Need Huseni's help on understanding the below task
   * Couldn't find `sev`, `cve` & `pkg` in JSON

   *** Hold on this task for now

    "APP CRON JOB STEP2
    0. Delete Image table contents. 

    1. FOR A PARTICULAR CLUSTER, from report table for report_type=app_compliance,, obtain report_by_image section of summary_json.

    2. For each image, gather list of {cve, sev, pkg} and img_vuln_count of {total, critical. high,, medium, low, neg, unknown}. Using this info, create new row in Image table if image_id doesn't exist (set cluster_list as {cluster_id}), else update existing row by appending cluster_id to the row's current cluster_list.

    Note : img_vuln_count => severity_count

  */

  let insertAppCornJobStep2 = (customer_id) => {
    return new Promise( async (resolve, reject) => {

      try{

        let reports = await Reports.find({
          report_type :'app_compliance',
          customer_id 
        }).exec();
        
        let clusterInfo = {};
        
        reports.forEach( (row) => {
          
          if( row['summary_json'] ){
            try{

              let critical   = 0;
              let high       = 0;
              let medium     = 0;
              let low        = 0;
              let negligible = 0;
              let unknown    = 0; 

              let value         = {};                   
              let singleImdV    = {}; 
              let singleImgInfo = [];
              let collact       = {};
                
              let parsedJson  = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let clusterName = row["cluster_name"];        

              if( typeof(parsedJson["report_by_image"]) === 'undefined'){
                return;
              }

              if( typeof(parsedJson["severity_count"]) === 'undefined'){
                return;
              }              
              
              let sevC = parsedJson["severity_count"];


              if(typeof(sevC.Critical) !== 'undefined'){
                value["critical"] = critical = parseFloat(sevC.Critical) || 0;
              }
              if(typeof(sevC.High) !== 'undefined'){
                value["high"] = high = parseFloat(sevC.High) || 0;
              }
              if(typeof(sevC.Medium) !== 'undefined'){
                value["medium"] = medium = parseFloat(sevC.Medium) || 0;
              }
              if(typeof(sevC.Low) !== 'undefined'){
                value["low"] = low = parseFloat(sevC.Low) || 0;
              }
              if(typeof(sevC.Negligible) !== 'undefined'){
                value["negligible"] = negligible = parseFloat(sevC.Negligible) || 0;
              }    
              if(typeof(sevC.Unknown) !== 'undefined'){
                value["unknown"] = unknown = parseFloat(sevC.Unknown) || 0;
              }    

              value["total"] = critical+high+medium+low+negligible+unknown; 

              parsedJson["report_by_image"].forEach( (singleImage) => {

                if(
                     typeof(singleImage["PackageName"]) === "undefined"
                  || typeof(singleImage["Vulnerability"]) === "undefined"
                  || typeof(singleImage["Severity"]) === "undefined"
                ){
                  return;
                }
                
                singleImdV['cve'] = singleImage["Vulnerability"];
                singleImdV['sev'] = singleImage["Severity"];
                singleImdV['pkg'] = singleImage["PackageName"];
 

                let imageID = (typeof(singleImage["ImageId"]) === "undefined" ) ? clusterName : singleImage["ImageId"];

                Images.findOneAndUpdate({ // WHERE
                  img_id      : imageID,
                  customer_id : customer_id            
                },{ // Update
                  vuln_list      : singleImdV,
                  severity_count : value,
                  cluster_list   : imageID,
                  img_name       : singleImage["Image"]
                },{ // Options
                  upsert: true
                }).exec();
              });  

            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        resolve();
      }catch(e){
        reject(e);
      }
    });
  }

  /*

    1. Read Image table severity_counts and prepare sorted list of vulnerable images for each cluster and for ""all"" clusters. Sort based on critical first, then high, then medium, then low, then neg and finally unknown. Limit each list to no more than maxImages items

    2. Break image name into repo name (before first /) and image shortname (after last /)

    3. In display table, for each cluster and for ""all"" cluster, update/insert row for display_item=TopVulnImg with display_item_value as [{repo_name1, image_shortname1, img_id1, imagename1, crit1, high1, medium1}]"

  */

  let insertTopVulnImg = (customer_id) => {
    return new Promise( async (resolve, reject) => {

      try{

        let maxImages = -1;
        function sort(param){
          param.sort((a, b) => { 

            if(a["critical"] !== b["critical"]){
              return b["critical"] - a["critical"];
            }

            if(a["high"] !== b["high"]){
              return b["high"] - a["high"];
            }     

            if(a["medium"] !== b["medium"]){
              return b["medium"] - a["medium"];
            }     

            if(a["low"] !== b["low"]){
              return b["low"] - a["low"];
            }    

            if(a["neg"] !== b["neg"]){
              return b["neg"] - a["neg"];
            }    
           
            return b["unknown"] - a["unknown"];

          });
        }                

        let reports        = await Images.find({customer_id}).exec();
        let clusterInfo    = {};
        let allClusterInfo = [];

        reports.forEach( (row) => {
          let value     = {};
          let imageName = row["img_name"];
          let BreakImg  = imageName.split("/");
          let sevC      = row["severity_count"];
          let sortArray = [];

          if(typeof(sevC.critical) !== 'undefined'){
            value["critical"] = parseFloat(sevC.critical) || 0;
          }
          if(typeof(sevC.high) !== 'undefined'){
            value["high"] = parseFloat(sevC.high) || 0;
          }
          if(typeof(sevC.medium) !== 'undefined'){
            value["medium"] = parseFloat(sevC.medium) || 0;
          }

          value['repo_name']       = BreakImg[0] || "";
          value['image_shortname'] = BreakImg[ BreakImg.length - 1] || "";
          value['img_id']          = row["img_id"];
          value['imagename']       = imageName;

          allClusterInfo.push(value);
    
        });

        //sorting
        sort(allClusterInfo);
        if(maxImages !== -1 && allClusterInfo.length > maxImages){
          allClusterInfo = allClusterInfo.slice(0, maxImages);
        }    

        //Saving in Database
        await Display.findOneAndUpdate({ // WHERE
          display_item: 'TopVulnImg',
          cluster_name: 'all',
          customer_id             
        },{ // Update
          'display_item_value' : JSON.stringify( allClusterInfo )
        },{ // Options
          upsert: true
        }).exec();

        resolve();
      }catch(e){
        reject(e);
      }
    });
  }

  /*
    "APP CRON JOB STEP3
    1. Read report_history table's summary_json field for report_type=appcompliancereport for each cluster

    2. For all timestamps within the ""max_duration"" configured (1 month?), obtain timestamp and {crit, high and med} values from severity count json inside summary_json and save into a map {timestamp1: {total1, crit1, high1}, timestamp2: {total2, crit2, high2}}

    3. Save above map as display_item_value into display table's display_item=ImgVulnTrend, for each cluster

    // TODO: Need Huseni's help in understanding the below task
    4. Repeat steps 1-3 above for cluster_id=all"

  */

  let insertAppCornJobStep3 = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{

        let maxDuration  = '1 month';
        let today        = new Date();      

        // TODO: Make created_at dynamic with maxDuration

        let reports = await ReportHistory.find({
          report_type : 'app_compliance',
          timestamp   : { $gte: today.setMonth(today.getMonth() - 3) },
          customer_id 
        }).exec();

        let clusterInfo = {};
        
        reports.forEach( (row) => {

          if( row['summary_json'] ){
            try{

              let crit = 0;
              let high = 0;
              let med  = 0;       
                             
              let parsedJson  = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let record      = parsedJson["severity_count"] || {};            
              let value       = {};
              let clusterName = row['cluster_name'];
              
              value[sFkey] = TimstampFormat(typeof(row['timestamp'] !== 'undefined')?row['timestamp']:'');

              if(typeof(record.Critical) !== 'undefined'){
                value["critical"] = crit = parseFloat(record.Critical) || 0;
              }
              if(typeof(record.High) !== 'undefined'){
                value["high"] = high = parseFloat(record.High) || 0;
              }
              if(typeof(record.Medium) !== 'undefined'){
                //value["medium"] = med = parseFloat(record.Medium) || 0;
                med = parseFloat(record.Medium) || 0;
              }
                                          
              value["total"] = crit + high + med;

              //value["timestamp"] = row['timestamp'];


              if(typeof(clusterInfo[clusterName]) === "undefined"){
                clusterInfo[clusterName] = [];
              }

              clusterInfo[clusterName].push(value);


            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        // Saving in Database
        let keyArray = Object.keys(clusterInfo);
        await Promise.map(keyArray, function(key) {
          return Display.findOneAndUpdate({ // WHERE
            display_item: 'ImgVulnTrend',
            cluster_name: key,
            customer_id              
          },{ // Update
            'display_item_value' : JSON.stringify( clusterInfo[key] )
          },{ // Options
            upsert: true
          }).exec();
        });

        resolve();
      }catch(e){
        reject(e);
      }
    });    
  } 

  /*

    "1. Read report table's summary_json for report_type=cluster_compliance and prepare sorted list of vulnerable Nodes for each cluster and for all clusters. Score for each Node is calculated as P*100/(P+F+W+I for each Node. Obtain P,F, W, I values from inside summary_json section which look like this: {""NodeName"":{""P"":36,""F"":30,""W"":3,""I"":3}}, where NodeName is the name of the Node. IGNORE all such sections where NodeName=All.  For sorting purposes, lowest score nodes are most vulnerable and should be on top of the list. Limit each list to no more than maxNodes items
    {{""node1"", ""cluster1"", score1},…upto maxNodes {}} 

    2. In display table, for each cluster and for ""all"" cluster, update/insert row for display_item=TopVulnNodes with display_item_value as {{node1, cluster1, score1}, {node2, cluster2,score2}..} For the individual cluster case, all the values of cluster in the json will be identical 
    "

    Modified version of this task: 

    "1. Read report table's summary_json for report_type=cluster_compliance and prepare sorted list of vulnerable Nodes for each cluster and for all clusters. Score for each Node is calculated as P*100/(P+F+W+I for each Node. Obtain P,F, W, I values from inside summary_json section which look like this: {""NodeName"":{""P"":36,""F"":30,""W"":3,""I"":3}}, where NodeName is the name of the Node. IGNORE all such sections where NodeName=All.  For sorting purposes, lowest score nodes are most vulnerable and should be on top of the list. Limit each list to no more than maxNodes items
    {{""node1"", ""cluster1"", score1, pass1, fail1, warn1, info1},…upto maxNodes {}} 

    2. In display table, for each cluster and for ""all"" cluster, update/insert row for display_item=TopVulnNodes with display_item_value as {{node1, cluster1, score1,pass1, fail1, warn1, info1}, {node2, cluster2,score2, pass2, fail2, warn2, info2}..} For the individual cluster case, all the values of cluster in the json will be identical 

  */

  let insertVulnerableNodes = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{

        let reports = await Reports.find({
          report_type :'cluster_compliance',
          customer_id
        }).exec();

        let clusterInfo = [];
        let maxNodes    = -1;

        function sort(param){
          param.sort((a, b) => {          
            return a[sSKey] - b[sSKey];
          });
        }

        reports.forEach( (row) => {

          if( row['summary_json'] ){
            try{                             
              let parsedJson = typeof(row['summary_json']) === 'string' ? JSON.parse(row['summary_json']) : row['summary_json'];
              let nodeInfo   = Object.keys(parsedJson);
              nodeInfo.forEach((node)=>{

                let pass  = 0;
                let fail  = 0;
                let warn  = 0;
                let info  = 0;  
                let total = 0;                
                let value = {};               

                if(node !== 'All'){
                  record = parsedJson[node];
                  value["node"] = node;
                  if(typeof(record.P) !== 'undefined'){
                    value[sPKey] = pass = parseFloat(record.P) || 0;
                  }
                  if(typeof(record.F) !== 'undefined'){
                    value[sEKey] = fail = parseFloat(record.F) || 0;
                  }
                  if(typeof(record.I) !== 'undefined'){
                    value[sIKey] = info = parseFloat(record.I) || 0;
                  }
                  if(typeof(record.W) !== 'undefined'){
                    value[sWKey] = warn = parseFloat(record.W) || 0;
                  }

                  total = pass+fail+warn+info;
                  // TODO: Ask Huseni, what to value to place for 0/0
                  // Right now saving 0

                  value[sSKey]       = total !== 0 ?  pass*100/(total) : 0; 
                  value['cluster_name']= row['cluster_name'];
                  //value['customer_id'] = customer_id;
                  clusterInfo.push(value);
                }
              }); 
            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });
        //Sorting records
        sort(clusterInfo);

        if(maxNodes !== -1 && clusterInfo.length > maxNodes){
          clusterInfo = clusterInfo.slice(0, maxNodes);
        }      

        //Saving in Database
        await Display.findOneAndUpdate({ // WHERE
          display_item: 'TopVulnNodes',
          cluster_name: 'all',
          customer_id              
        },{ // Update
          'display_item_value' : JSON.stringify( clusterInfo )
        },{ // Options
          upsert: true
        }).exec();
        
        resolve();
      }catch(e){
        reject(e);
      }
    });    
  }  


  // "1. For individual clusters, existing code already refers to report table for report_type=workload_compliance and obtains recommend_json which has a sorted list of recommendations and their impact

  // 2. For ""all"" clusters, for each recommendation msg, add each field inside the TypeCount section of the recommend_json to determine total TypeCount field numbers for that particular msg.  TypeCount field looks like:  {pod: value, daemonset: value, deployment: value namespace: value} 

  // 3. Based on these aggregated (for all clusters) TypeCounts fields, a sorted list of recommendations is created, where sorting is done based on the total  of all the fields of the TypeCount.

  // 3. In table Display for cluster_name=""all"" add row with display_item=TopWorkloadCompReco and display_item_value as a sorted list (from previous step) of the following: {{name1, msg1, level1, {TypeCount1}, fix1}, {}} 

  // [{name1, msg1, level1, {TypeCount1}, fix1}, {}]

  // 4. Name1 and fix1 in above json are to be obained from a static table by mapping from msg"  

  let insertTopWorkloadCompReco = (customer_id) =>{

    return new Promise( async (resolve, reject) => {

      try{

        let reports = await Reports.find({
          report_type :'workload_compliance',
          customer_id 
        }).exec();

        function sort(param){
          param.sort((a, b) => {          
            return a["typeCount"].total - b["typeCount"].total;
          });
        }
        
        //let maxTypeCount     = -1;
        let allStoreData = [];       
        reports.forEach( (row) => {

          if( row['recommend_json'] ){
            try{
              let clusterInfo = {};   
              let parsedJson = typeof(row['recommend_json']) === 'string' ? JSON.parse(row['recommend_json']) : row['summary_json'];
              parsedJson.map( (data) => {
                let pod        = 0;
                let daemonSet  = 0;
                let deployment = 0;
                let namespace  = 0;  
                let total      = 0;
                let typeContT  = {};
                let value      = {};

                let typeCont = data['TypeCount'] || {}; 
                let level    = data['level'];
                

                if(typeof(typeCont.pod) !== 'undefined'){
                  typeContT['pod'] = pod = parseFloat(typeCont.pod) || 0;
                }
                if(typeof(typeCont.daemonSet) !== 'undefined'){
                  typeContT['daemonSet'] = daemonSet = parseFloat(typeCont.daemonSet) || 0;
                }
                if(typeof(typeCont.deployment) !== 'undefined'){
                  typeContT['deployment'] = deployment = parseFloat(typeCont.deployment) || 0;
                }
                if(typeof(typeCont.namespace) !== 'undefined'){
                  typeContT['namespace'] = namespace = parseFloat(typeCont.namespace) || 0;
                }

                typeContT['total'] = pod + daemonSet + deployment + namespace;

                value['name']      = row['cluster_name'];
                value['msg']       = data['msg'];
                value['level']     = data['level'];
                value['typeCount'] = typeContT;

                allStoreData.push(value);
              } );
            }catch(e){
              console.log('Unable to process a single record');
            }
          }
        });

        // //Sorting records
        sort(allStoreData);

        // if(maxTypeCount !== -1 && clusterInfo.length > maxTypeCount){
        //   clusterInfo = clusterInfo.slice(0, maxTypeCount);
        // }   

        // Saving in Database

        //let keyArray = Object.keys(clusterInfo);
        await Promise.map(allStoreData, function(key) {
          return Display.findOneAndUpdate({ // WHERE
            display_item: 'TopWorkloadCompReco',
            cluster_name: 'all',
            customer_id              
          },{ // Update
            'display_item_value' : JSON.stringify( allStoreData )
          },{ // Options
            upsert: true
          }).exec();
        });        

        resolve();
      }catch(e){
        reject(e);
      }
    });    
  }

  /*

    "1. Get raw_report for report_type=cluster_compliance in Report table. Inside the raw_report, perform the following:
    ==========
    1. Scrape Text line after [FAIL] and [WARN] tags in the report section for each node. Save this text as ""description text"". Also inside this descriton text, find compliance check # (e.g. 2.2.5) for fail and warn, and then look for text next to that same compliance check # in the Remediation section of the report for that node. Save that text as ""fix text"". Set Impact as 1 Node.
    2. Perform  same steps for remaining nodes in report. If the FAIL or WARN is already existing for the compliance check #, just increment impact by 1 Node.
    3. Update that row in the report table by setting recommend_json  as [{""name"": ""fail"", ""description"": ""2.2.5 description text"", ""impact: ""3 Nodes"", ""fix"": ""fix text"" }, {""name"": warn ""description"": ""2.2.8 description text2"", ""impact: ""2 Nodes"", ""fix"": ""fix text2"" }]
    4. Sort the entries in recommend_json based on number of Nodes and FAIL vs WARN. All FAILs come first, and within that, entries with more number of Nodes are placed at the top 

  */

  // "Description Text", "Fix Text", "Impace"

  let insertRawReportFW = (customer_id) =>{
    return new Promise( async (resolve, reject) => {
      try{

        let reports = await Reports.find({
          report_type :'cluster_compliance',
          customer_id 
        }).exec();

        let allStoreData = []; 
        let clusterInfo  = {};
        let json         = {}; 

        // 1. Scrape Text line after [FAIL] and [WARN] tags in the report section for each node. Save this text as ""description text"". Also inside this descriton text, find compliance check # (e.g. 2.2.5) for fail and warn, and then look for text next to that same compliance check # in the Remediation section of the report for that node. Save that text as ""fix text"". Set Impact as 1 Node.

        reports.forEach( (row) => {

          let primeInfo       = {};
          let remediationInfo = {};

          if( row['raw_report'] ){
            try{
              let addArray    = [];
              var alltextArray = [];
              let parsedJson  = typeof(row['raw_report']) === 'string' ? JSON.parse(row['raw_report']) : row['raw_report'];
              let nodeInfo    = parsedJson.nodes;


              
              nodeInfo.forEach( (data) => {

                let reportInfo  = data.report;
                let name        = data.name;
                let lines       = reportInfo.split("\n");
                let currentStage = 'prime'; // Remediations, Summary

      
                // Used in prime only
                let previousObj  = null; // Contiain reference to previous prime object
                 
                // Used in remidation only
                let canBeRemidationStart = false; // Will be enabled when previous line is empty
                let currentRemidations   = [];    // Array of all remidations for current version
                let currentVersion       = null;  


                lines.forEach(( line ) => {

                  if(currentStage === 'prime'){


                    // Switch To Remediations Stage
                    if( line.trim() === "== Remediations ==" ){
                      currentStage = 'Remediations';
                      canBeRemidationStart = true;
                      // Removing new line chracter form last parsed Object
                      if( previousObj !== null){
                        previousObj['text'] =  previousObj['text'].trim();
                        previousObj  = null;
                      }
                      return;
                    }

                    // Switch To Summary Stage
                    if( line.trim() === "== Summary ==" ){
                      currentStage = 'summary';
                      return;
                    }

                    // Adding extra line into previous text
                    if( line.indexOf('[') !== 0 ){
                      if( previousObj !== null){
                        previousObj['text'] =  previousObj['text'] + "\n" + line;
                      }
                      return;
                    }

                    // Finding the type
                    
                    let typeSplit = line.split("]");

                    if ( typeSplit.length < 1){
                      return;
                    }

                    let type    = typeSplit.shift().substr(1);
                    let vTArray = typeSplit.join("]").replace(/^\s+/,"").split(" "); // version text array
                    let version = vTArray.shift();
                    let text    = vTArray.join(" ");

                    // Check for version
                    if( version.search(/^[0-9|.]+$/) !== 0 ){
                      previousObj['text'] =  previousObj['text'] + "\n" + line;
                      return;                        
                    }


                    if( typeof (primeInfo[type] ) === 'undefined'){
                      primeInfo[type] = {};
                    }

                    if( typeof(primeInfo[type][version]) !== 'undefined'){
                      primeInfo[type][version]['count'] += 1;
                      previousObj = null;
                      return;
                    }

                    previousObj = {
                      'count': 1,
                      'text' : text
                    }

                    primeInfo[type][version] = previousObj;

                    return;

                  }

                  

                  if( currentStage === 'Remediations'){
                    // Switch To Summary Stage
                    if( line.trim() === "== Summary ==" ){
                      currentStage = 'summary';
                      // Saving last recommendation
                      if( currentVersion !== null ){
                        remediationInfo[currentVersion] = currentRemidations.join("\n").trim();
                        currentRemidations = [];
                        currentVersion= null;
                      }
                      return;
                    }


                    if( line.trim() === ''){
                      canBeRemidationStart = true;
                      currentRemidations.push( line );
                      return;
                    }



                    if(canBeRemidationStart){

                      // 2.1.10 If using a Kubelet config file, edit the file to set tlsCertFile to the location of the certificate

                      let vTArray = line.split(" "); // version text array
                      let version = vTArray.shift();

                      // TODO: Check if version is valid or not

                      if( version.search(/^[0-9|.]+$/) !== 0 ){
                        currentRemidations.push( line );
                        canBeRemidationStart = false;
                        return;                        
                      }



                      if( currentVersion !== null ){
                        remediationInfo[currentVersion] = currentRemidations.join("\n").trim();
                        currentRemidations = [];
                      }

                      currentVersion = version;

                      currentRemidations.push( vTArray.join(" ") );
                      canBeRemidationStart = false;
                      return;
                    }

                    currentRemidations.push( line );

                  }



                   
                  if( currentStage === 'Summary'){
                    return;
                  }


                });
           

                // In case Remediations is not then removing new line chracter from end.
                if( previousObj !== null){
                  previousObj['text'] =  previousObj['text'].trim();
                  previousObj  = null;
                }

                // In case Summary is not then removing new line chracter from end.
                if( currentVersion !== null ){
                  remediationInfo[currentVersion] = currentRemidations.join("\n").trim();
                  currentRemidations = [];
                  currentVersion = null;
                }

              });

              let recommendJson = [];


              ['FAIL', 'WARN'].forEach((type) => {

                let typeObj = primeInfo[type];

                let sortedFailKey = Object.keys(typeObj).sort( (a,b) => typeObj[b].count - typeObj[a].count );

                sortedFailKey.forEach( (key) => {

                  let obj = typeObj[key];

                  recommendJson.push({
                    name : type,
                    description : `${key} ${obj['text']}`,
                    impact : `${obj['count']} Nodes`,
                    fix: typeof(remediationInfo[key] !== 'undefined') ? remediationInfo[key] : ""
                  });

                });

              });

              // 2. Perform  same steps for remaining nodes in report. If the FAIL or WARN is already existing for the compliance check #, just increment impact by 1 Node.
              // 3. Update that row in the report table by setting recommend_json  as [{""name"": ""fail"", ""description"": ""2.2.5 description text"", ""impact: ""3 Nodes"", ""fix"": ""fix text"" }, {""name"": warn ""description"": ""2.2.8 description text2"", ""impact: ""2 Nodes"", ""fix"": ""fix text2"" }]
              // 4. Sort the entries in recommend_json based on number of Nodes and FAIL vs WARN. All FAILs come first, and within that, entries with more number of Nodes are placed at the top

              return Reports.findByIdAndUpdate( row._id,{ // Update
                'recommend_json' : JSON.stringify( recommendJson )
              }).exec();


            }catch(e){
              console.log('E', e);
              console.log('Unable to process a single record');
            }
          }
        });      

        resolve();
      }catch(e){
        reject(e);
      }
    });    
  }

// Testing CNOXSummary
  //"1. For each customer   "
  let insertAppCronJobStep4 = (customer_id) => {
    return new Promise( async (resolve, reject) => {
      try{
      	let clusterList;
      	let clusters;
      	let stackClusters
       	
       	await ResourceHistories.aggregate(
        	[
        		{ "$match": { "customer_id": customer_id } },
        		{ '$group' : {
        				'_id': '$cluster_name'
        		}}
        	],
        	function(err, clusters) {
        		if(err) throw err;
        		clusterList = clusters;
        		return clusters;
        	});

       	await Clusters.aggregate(
       		[
        		{ '$match': {$and: [
        			{"cnox_stack" : /_stack/},
        			{"license_key": customer_id}]
        			
        		}},
        		{ '$group' : {
        				'_id': '$cluster_name'
        		}},
       		], function(err, clusters) {
       			if(err) throw err;
       			stackClusters = clusters;
       			return clusters;
       		});

       	await Clusters.aggregate(
       		[
        		{ '$match': {$and: [
        			{"license_key": customer_id}]
        			
        		}},
        		{ '$group' : {
        				'_id': '$cluster_name'
        		}},
       		], function(err, result) {
       			if(err) throw err;
       			clusters = result;
       			return clusters;
       		});
       		
       	console.log(customer_id);
       	let coveragepercent = 100 * stackClusters.length / clusters.length;
       	console.log(coveragepercent);

        let totalNodes = 0;
        let totalPods = 0;
        let totalServices = 0;
        let totalCnoxPods = 0;
        let totalCnoxServices = 0;
        let i = 0;
        let clustersLen = clusterList.length;

        clusterList.forEach((row) => {
          if(row._id)
          {
            return new Promise( async (resolve, reject) => {
              try {
                let histories = await ResourceHistories.
                  find({
                    cluster_name: row._id,
                    customer_id: customer_id
                  }).
                  sort({timestamp: -1}).
                  limit(1).
                  exec();

                  if(histories.length > 0)
                  {
                		let display_item_value = '{1,1, "nodes": '+histories[0]['nodes']+', "pods": '+histories[0]['pods']+', services": '+histories[0]['services']+', "cnox_pods": '+histories[0]['cnox_pods']+', "cnox_services": '+histories[0]['cnox_services']+'}';

                    	await Display.findOneAndUpdate({ // WHERE
    			            display_item: 'CNOXSummary',
    			            cluster_name: histories[0]['cluster_name'],
    			            customer_id              
    			          },{ // Update
    			            'display_item_value' : display_item_value
    			          },{ // Options
    			            upsert: true
    			          }).exec();
                  }
                  else
                  {
                    	let display_item_value = '{1,1, "nodes": 0, "pods": 0, services": 0, "cnox_pods": 0, "cnox_services": 0}';

	                    await Display.findOneAndUpdate({ // WHERE
		                      display_item: 'CNOXSummary',
		                      cluster_name: row['cluster_name'],
		                      customer_id              
		                    },{ // Update
		                      'display_item_value' : display_item_value
		                    },{ // Options
		                      upsert: true
	                    }).exec();
                  }
                  resolve(histories);
              }catch(e) {
                reject(e);
              }
            }).then(function(histories) {
              i++;
              if(histories.length > 0)
              {
                totalNodes += parseInt(histories[0]['nodes']),
                totalServices += parseInt(histories[0]['services']),
                totalPods += parseInt(histories[0]['pods']),
                totalCnoxPods += parseInt(histories[0]['cnox_pods']),
                totalCnoxServices += parseInt(histories[0]['cnox_services']);
              }

              if(i === clustersLen)
              {
              	console.log(customer_id);
              	console.log(i);
                let display_item_value = '{"coveragepercent": '+coveragepercent+', "clusters": '+clustersLen+', "nodes": '+totalNodes+', "pods": '+totalPods+', "services": '+totalServices+', "cnox_pods": '+totalCnoxPods+', "cnox_services": '+totalCnoxServices+'}';

                Display.findOneAndUpdate({ // WHERE
  		            display_item: 'CNOXSummary',
  		            cluster_name: "all",
  		            customer_id              
  		          },{ // Update
  		            'display_item_value' : display_item_value
  		          },{ // Options
  		            upsert: true
  		          }).exec();
              }
            });
          }
        });
         console.log('new customer');
         resolve(customer_id);
      }catch(e){
        reject(e);
      }
    });
  }

  let performCronAction = async () => {

    // let customerDetials = await Customer.find({ status: 'Activate', name: { $nin : ['microsoft']} }).exec();
    let customerDetials = await Customer.find({ status: 'Activate'}).exec();

    return await Promise.all([
      // await Promise.map(customerDetials, row => insertDisplayInfoForSingleCustomer(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertReportInfoForSingleCustomer(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertReportHistoryInfoForSingleCustomer(row['customer_id']) ),       
      // await Promise.map(customerDetials, row => insertClusterVulnSummary(row['customer_id']) ),       
      // await Promise.map(customerDetials, row => insertTopVulnClusters(row['customer_id']) ),      
      // await Promise.map(customerDetials, row => insertClusterScoreTrend(row['customer_id']) ),      
      // await Promise.map(customerDetials, row => insertAppCornJobStep1(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertAppCornJobStep3(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertVulnerableNodes(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertTopWorkloadCompReco(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertAppCornJobStep2(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertTopVulnImg(row['customer_id']) ),
      // await Promise.map(customerDetials, row => insertRawReportFW(row['customer_id']) ),
      await Promise.map(customerDetials, row => insertAppCronJobStep4(row['customer_id']))
    ]);

  }               

  // defining routes.
  app.get('/cron', async (req, res) => {
    try{
      let response = performCronAction();
      return res.send(JSON.stringify(response, null , 2));
    }catch(e){
      return res.send(`Error while processing records ${e.message || ""}`);
    }
  });



  new CronJob('*/30 * * * *', function() {
    try{
      performCronAction();
    }catch(e){ 
      // Discard cron error
    }
  }, null, true, 'America/Los_Angeles');

  performCronAction();

}

