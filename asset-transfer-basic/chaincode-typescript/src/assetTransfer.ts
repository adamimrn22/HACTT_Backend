/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Asset} from './asset';
import Long from 'long';
import { create } from 'domain';
import { ClientIdentity } from 'fabric-shim';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading assets'})
export class AssetTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const assets: Asset[] = [
            {
                idtest_cases: '8801',
                test_desc: 'Desc1 from Hyperledger,  status cannot be edited',
                deadline: '2024-06-25',
                // dateUpdated: '2024-06-22',
                projectId: '01',
                // reason: 'Reason01',
                testCaseName: 'Test Case 1',
                dateCreated: '2024-06-20',
                overallStatus: 'Pending',
                username: 'Will',
                // userID: [2001, 2002]
                // createdBy: 'John',
                // status: 'Approved',
                
            },
            {
                idtest_cases: '8802',
                test_desc: 'Desc2 from Hyperledger, status cannot be edited',
                deadline: '2024-06-25',
                // dateUpdated: '2024-06-22',
                projectId: '02',
                // reason: 'Reason02',
                testCaseName: 'Test Case 2',
                dateCreated: '2024-06-20',
                overallStatus: 'Pending',
                username: 'Will',
                // userID: [2001, 2002]
                // createdBy: 'John',
                // status: 'Approved', 
            },
        ];

        for (const asset of assets) {
            //asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.idtest_cases, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.info(`Test Case ${asset.idtest_cases} initialized`);
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateAsset(ctx: Context, id: string, tcdesc: string, dl: string, pid: string, 
        tcn: string, dtc: string, usrn: string, ostts: string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        // Convert userID strings to number array
        // const userID = uid.map(Number);

        const asset = {
            idtest_cases: id,
            test_desc: tcdesc,
            deadline: dl,
            projectId: pid,
            testCaseName: tcn,
            dateCreated: dtc,
            username: usrn,
            // status: stts,
            overallStatus: ostts,
            // userID: uid
            // userID: uid.split(",").map(Number),
            
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    // UpdateTestCaseStatus updates the status of a test case in Hyperledger Fabric TODO

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    @Transaction()
    public async UpdateAsset(ctx: Context, id: string, tcdesc: string, dl: string, pid: string,
        tcn: string, dtc: string, usrn: string, ostts: string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        //TODO update with new variables
        // overwriting original asset with new asset
        const updatedAsset = {
            idtest_cases: id,
            test_desc: tcdesc,
            deadline: dl,
            projectId: pid,
            testCaseName: tcn,
            dateCreated: dtc,
            username: usrn,
            overallStatus: ostts,
            // userID: uid
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // update only overall status of the asset
    @Transaction()
    public async UpdateStatus(ctx: Context, id: string, ostts: string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.overallStatus = ostts;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    }
    

    // DeleteAsset deletes an given asset from the world state.
    @Transaction()
    public async DeleteAsset(ctx: Context, idtest_cases: string): Promise<void> {
        const exists = await this.AssetExists(ctx, idtest_cases);
        if (!exists) {
            throw new Error(`The asset ${idtest_cases} does not exist`);
        }
        return ctx.stub.deleteState(idtest_cases);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
    @Transaction()
    public async TransferAsset(ctx: Context, id: string, newOwner: string): Promise<string> {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    //  returns the ID associated with the invoking identity. 
    @Transaction(false)
    @Returns('string')
    public async GetID(ctx: Context): Promise<string> {
        const cid = new ClientIdentity(ctx.stub);
        return cid.getID();
    }

}