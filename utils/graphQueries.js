import { gql, request } from 'graphql-request';
const { create, CID } = require('ipfs-http-client');
import { utils } from "ethers";

const APIURL = 'https://api.studio.thegraph.com/query/101/fraktalgoerli/v0.0.7';

const ipfsClient = create({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",});

const creator_query = gql`
query($id:ID!){
  fraktalNFTs(where:{creator:$id}) {
    id
    marketId
    hash
    owner {
      id
    }
    createdAt
    creator {
      id
    }
  }
  }
`;
const marketid_query = gql`
query($id:ID!){
  fraktalNFTs(where:{marketId:$id}) {
    id
    marketId
    hash
    createdAt
    owner {
      id
    }
    fraktions {
      owner {
        id
      }
      amount
    }
    creator {
      id
    }
  }
}
`;
const all_nfts = gql`
query {
  fraktalNFTs(first: 20, orderBy: "createdAt",  orderDirection: "desc") {
    id
    marketId
    hash
    owner {
      id
    }
    createdAt
    creator {
      id
    }
  }
}
`;
const creators_review = gql`
  query{
    users(first: 20) {
      id
      fraktals
      created {
        id
        marketId
        hash
        creator
        owner
        createdAt
      }
    }
  }
`
const account_fraktions_query = gql`
  query($id:ID!){
    fraktionsBalances(first:10, where:{owner:$id}){
      id
      amount
      owner {
        id
        balance
      }
      nft {
        id
        marketId
        hash
        creator{
          id
        }
        owner{
          id
        }
        createdAt
      }
    }
  }
`
const listedItems = gql`
  query{
    listItems(first: 10, where:{amount_gt: 0}){
      id
      price
      amount
      balance
      type
      seller {
        id
      }
      fraktal {
        hash
        owner {
          id
        }
        fraktions {
          owner{
            id
          }
          amount
        }
        marketId
        creator {
          id
        }
        createdAt
      }
    }
  }
`;
const listedItemsId = gql`
  query($id:ID!){
    listItems(where:{id:$id}){
      id
      seller {
        id
      }
      fraktal {
        id
        hash
        owner{
          id
        }
        fraktions {
          owner{
            id
            balance
          }
          amount
        }
        marketId
        creator {
          id
        }
        createdAt
        transactionHash
      }
      price
      amount
      type
      balance
    }
  }
`;

export const getSubgraphData = async (call, id) => {
  let callGql = calls.find(x=> {return x.name == call})
  try {
    const data = await request(APIURL , callGql.call, {id});
    // console.log('data for:',id,' found',data)
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('error', err);
    return err;
  }
};

export async function createObject(data){
  let nftMetadata = await fetchNftMetadata(data.hash)
  if(nftMetadata){
    // console.log('meta',nftMetadata)
    return {
      creator:data.creator.id,
      owner: data.owner.id,
      id: data.marketId,
      balances: data.fraktions,
      createdAt: data.createdAt,
      name: nftMetadata.name,
      description: nftMetadata.description,
      imageURL: checkImageCID(nftMetadata.image),
    }
  }
};
export async function createListed(data){
  let nftMetadata = await fetchNftMetadata(data.fraktal.hash)
  if(nftMetadata){
    return {
      creator:data.fraktal.creator.id,
      marketId: data.fraktal.marketId,
      createdAt: data.fraktal.createdAt,
      owner: data.fraktal.owner.id,
      raised: data.balance,
      id: data.id,
      price:utils.formatEther(data.price),
      amount: data.amount,
      seller: data.seller.id,
      name: nftMetadata.name,
      description: nftMetadata.description,
      imageURL: checkImageCID(nftMetadata.image),
    }
  }
};
const calls = [
  {name: 'account_fraktions', call: account_fraktions_query},//
  {name: 'marketid_fraktal', call: marketid_query},//
  {name: 'listed_items', call: listedItems},//
  {name: 'listed_itemsId', call: listedItemsId},//
  {name: 'artists', call: creators_review},//
  {name: 'all', call: all_nfts},
  {name: 'creator', call: creator_query},//
];


function toBase32(value) { // to transform V0 to V1 and use as `https://${cidV1}.ipfs.dweb.link`
  var cid = new CID(value)
  return cid.toV1().toBaseEncodedString('base32')
};

function checkImageCID(cid){
  let correctedCid
  if(cid.startsWith('https://ipfs.io/ipfs/')){
    let splitted = cid.split('https://ipfs.io/ipfs/')
    correctedCid = splitted[1]
  }else{
    correctedCid = cid
  }
  let cidv1 = toBase32(correctedCid)
  return `https://${cidv1}.ipfs.dweb.link`
};

// Convert Binary Into JSON
const binArrayToJson = function(binArray)
{
    var str = "";
    for (var i = 0; i < binArray.length; i++) {
        str += String.fromCharCode(parseInt(binArray[i]));
    }
    return JSON.parse(str)
};
async function fetchNftMetadata(hash){
  let chunks
  for await (const chunk of ipfsClient.cat(hash)) {
      chunks = binArrayToJson(chunk);
  }
  // console.log('NFT metadata: ',chunks)
  return chunks;
};
