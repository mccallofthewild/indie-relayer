import { useManager } from "@cosmos-kit/react";
import { Center, Grid, GridItem } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  ChainOption,
  ChooseChain,
  handleSelectChainDropdown,
  ConnectWalletButton,
} from ".";
import { ChainName } from "@cosmos-kit/core";
import { WalletCardSection } from "./card";

export const WalletSection = (
  props: {
    onChainChange?: (chainName: ChainName) => void;
    storageKey?: string;
  } = {}
) => {
  const storageKey = useMemo(() => {
    return "selected-chain:" + props.storageKey;
  }, [props.storageKey]);

  const [chainName, setChainName] = useState<ChainName | undefined>(
    "cosmoshub"
  );
  const { chainRecords, getChainLogo } = useManager();

  const chainOptions = useMemo(
    () =>
      chainRecords.map((chainRecord) => {
        return {
          chainName: chainRecord?.name,
          label: chainRecord?.chain.chain_id,
          value: chainRecord?.name,
          icon: getChainLogo(chainRecord.name),
        };
      }),
    [chainRecords, getChainLogo]
  );

  useEffect(() => {
    const chain = window.localStorage.getItem(storageKey) || "cosmoshub";
    setChainName(chain);
    props?.onChainChange?.(chain as ChainName);
  }, []);

  const onChainChange: handleSelectChainDropdown = async (
    selectedValue: ChainOption | null
  ) => {
    setChainName(selectedValue?.chainName);
    if (selectedValue?.chainName) {
      window?.localStorage.setItem(storageKey, selectedValue?.chainName);
    } else {
      window?.localStorage.removeItem(storageKey);
    }
    try {
      props.onChainChange?.(selectedValue?.chainName as ChainName);
    } catch (error) {
      console.error(error);
    }
  };

  const chooseChain = (
    <ChooseChain
      chainName={chainName}
      chainInfos={chainOptions}
      onChange={onChainChange}
    />
  );

  return (
    <Center py={6}>
      <Grid
        w="full"
        maxW="sm"
        templateColumns="1fr"
        rowGap={4}
        alignItems="center"
        justifyContent="center"
      >
        <GridItem>{chooseChain}</GridItem>
        {chainName ? (
          <WalletCardSection chainName={chainName}></WalletCardSection>
        ) : (
          <ConnectWalletButton buttonText={"Connect Wallet"} isDisabled />
        )}
      </Grid>
    </Center>
  );
};
