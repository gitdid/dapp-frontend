import { Box, Grid, HStack, Text, VStack } from "@chakra-ui/layout";
import { BigNumber } from "ethers";
import Head from "next/head";
import NextLink from "next/link";
import { useState, useEffect } from "react";
import FrakButton from "../components/button";
import Dropdown from "../components/dropdown";
import NFTItem from "../components/nft-item";
import { FrakCard } from "../types";
import { getSubgraphData } from '../utils/graphQueries';
import { createListed } from '../utils/nftHelpers';
import InfiniteScroll from "react-infinite-scroll-component";
const SORT_TYPES = ["Popular", "Ending Soonest", "Newly Listed"];

const Home: React.FC = () => {
  const [nftItems, setNftItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [sortType, setSortType] = useState("Popular");
  const [loading, setLoading] = useState(false);
  const handleSortSelect = (item: string) => {
    setSortType(item);
    setSelectionMode(false);
  };

  useEffect(async ()=>{
    setLoading(true);
    await getMoreListedItems();
    // let data = await getSubgraphData('listed_items','');
    // filter on graphQl
    // const dataOnSale = data.listItems.filter(x=>{return x.fraktal.status == 'open'});
    // if(dataOnSale){
    //   Promise.all(dataOnSale.map(x=>{return createListed(x)})).then((results)=>setNftItems(results));
    // }
    setLoading(false);
  },[])



  const getMoreListedItems = async () => {
  // should read where to start (nftItems.length) and add some items continously
    const data = await getSubgraphData('listed_items','');
    console.log('listed items ',data)
    let dataOnSale = data.listItems.filter(x=>{return x.fraktal.status == 'open'}); // this goes in the graphql query
    if(dataOnSale){
      Promise.all(dataOnSale.map(x=>{return createListed(x)})).then((results)=>setNftItems([...nftItems, ...results]));
    }
  };

  const demoNFTItemsFull: FrakCard[] = Array.from({ length: 9 }).map(
    (_, index) => ({
      id: index + 1,
      name: "Golden Fries Cascade",
      imageURL: "/filler-image-1.png",
      contributions: BigNumber.from(5).div(100),
      createdAt: new Date().toISOString(),
      countdown: new Date("06-25-2021"),
    })
  );

  return (
    <VStack spacing='0' mb='12.8rem'>
      <Head>
        <title>Fraktal - Marketplace</title>
      </Head>
      <HStack w='96.4rem' spacing='0' justifyContent='space-between' mb='4rem'>
        <Box position='relative' w={"110px"}>
          {!selectionMode ? (
            <FrakButton
              style={{ minWidth: "200px" }}
              isOutlined
              onClick={() => setSelectionMode(true)}
            >
              Sort: {sortType}
            </FrakButton>
          ) : (
            <Dropdown
              items={SORT_TYPES}
              onItemClick={handleSortSelect}
              position='absolute'
              mt='-3rem'
              zIndex='1'
            />
          )}
        </Box>
        <Text className='semi-48'>Marketplace</Text>
        <NextLink href='/my-nfts'>
          <FrakButton>List NFT</FrakButton>
        </NextLink>
      </HStack>
        {loading ? 'loading..' :
        <div>
        {nftItems.length ? (
          <>
            <InfiniteScroll
              dataLength={nftItems.length}
              next={getMoreListedItems}
              // hasMore={hasMore}
              style={{display:'ininline'}}
              loader={<h3> Loading...</h3>}
              endMessage={<h4>Nothing more to show</h4>}
            >
              <Grid
                margin='0 !important'
                mb='5.6rem !important'
                w='100%'
                templateColumns='repeat(3, 1fr)'
                gap='3.2rem'
              >
                {nftItems.map(item => (
                  <NextLink key={item.id} href={`/nft/${item.tokenAddress}/details`}>
                    <NFTItem
                      name={item.name}
                      amount={item.amount}
                      price={item.price}
                      imageURL={item.imageURL}
                     />
                  </NextLink>
                ))}
              </Grid>
            </InfiniteScroll>
          </>
        ) : (
          <VStack>
            <Text className='medium-16'>Whoops, no NFTs are for sale.</Text>
            <Text className='medium-16'>Check back later or list your own!</Text>
            <NextLink href='/mint-nft'>
              <FrakButton mt='1.6rem !important'>Mint NFT</FrakButton>
            </NextLink>
          </VStack>
        )}
      </div>
      }
    </VStack>
  );
};

export default Home;
