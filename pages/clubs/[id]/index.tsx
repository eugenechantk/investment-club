import React, { lazy, ReactElement, Suspense, useEffect } from "react";
import AppLayout from "../../../layout/AppLayout";
import { NextPageWithLayout } from "../../_app";
import { adminAuth, adminFirestore } from "../../../firebase/firebaseAdmin";
import { InferGetServerSidePropsType } from "next";
import ClubDetails from "../../../components/ClubDetails/ClubDetails";
import ClubMembers from "../../../components/ClubMembers/ClubMembers";
import ClubBalance from "../../../components/ClubBalance/ClubBalance";
import Portfolio from "../../../components/Portfolio/Portfolio";
import _ from "lodash";
import nookies from "nookies";
import NotAuthed from "../../../components/NotAuthed/NotAuthed";
import {
  fetchPortfolio,
  getClubMemberBalance,
  getLatestBlockNumber,
  IHoldingsData,
  verifyClubHolding,
} from "../../../lib/ethereum";
import NotVerified from "../../../components/NotVerified/NotVerified";
import Splitting from "../../../components/Splitting/Splitting";
import { useRouter } from "next/router";
import LoadingWidget from "../../../components/Widgets/LoadingWidget";
import { clearSignClients, legacySignClient, signClient } from "../../../lib/walletConnectLib";
const WidgetSection = lazy(
  () => import("../../../components/Widgets/WidgetSection")
);

export interface IClubInfo {
  club_description: string;
  club_image?: string;
  club_name: string;
  club_token_sym: string;
  club_wallet_address?: string;
  club_wallet_mnemonic?: string;
  club_token_address?: string;
  deposited?: boolean;
  club_members?: { [k: string]: number };
  last_retrieved_block?: number;
  split_contract_address?: string;
}

export interface IMemberInfoData {
  display_name: string;
  profile_image: string;
  uid: string;
}

interface ITransferEvent {
  transaction_hash: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  to_address: string;
  from_address: string;
  value: string;
  transaction_index: number;
  log_index: number;
}

export const getServerSideProps = async (context: any) => {
  const { id } = context.params;
  const cookies = nookies.get(context);
  // console.log(cookies)
  // console.log(id);

  // Fetch function for club information
  const fetchClubInfo = async (id: string) => {
    try {
      const _clubInfo = await adminFirestore
        .collection("clubs")
        .doc(id)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            throw new Error("club does not exist in database");
          }
          return doc.data() as IClubInfo;
        })
        .then((data) => {
          return { ...data };
        });
      return _clubInfo;
    } catch (err) {
      throw err;
    }
  };

  // Fetcher function for club members
  const fetchMemberInfo = async (
    clubInfo: IClubInfo
  ): Promise<IMemberInfoData[]> => {
    // STEP 1: Fetch the latest club member list
    const _club_members = await getClubMemberBalance(clubInfo, id);

    // STEP 2: Update the club member list
    const currentBlock = await getLatestBlockNumber();
    const result = adminFirestore.collection("clubs").doc(id).update({
      club_members: _club_members,
      last_retrieved_block: currentBlock,
    });

    // STEP 3: Fetch club members info by the updated club member list
    let memberInfo = [] as IMemberInfoData[];
    await Promise.all(
      Object.keys(_club_members).map(async (uid) => {
        // console.log(uid)
        const _memberInfo = await adminAuth.getUser(uid);
        memberInfo.push({
          display_name: _memberInfo.displayName!,
          profile_image: _memberInfo.photoURL!,
          uid: _memberInfo.uid,
        });
      })
    );
    return memberInfo;
  };

  if (!cookies.token) {
    return {
      props: {
        error: "Not authed",
      },
    };
  } else {
    try {
      // Prereq: get user address and club info
      const userAddress = await adminAuth
        .verifyIdToken(cookies.token)
        .then((decodedToken) => decodedToken.uid);
      // console.log(userAddress)
      // Step 1: Get club information
      const clubInfo: IClubInfo = await fetchClubInfo(id);

      // Step 2: Check if the user has club tokens to access this club
      const verify = await verifyClubHolding(
        userAddress,
        clubInfo.club_token_address!
      );
      // console.log(verify)
      if (!verify) {
        throw Error("Not verified");
      }

      // Step 3: Fetch porfolio of the club
      const balance: IHoldingsData[] = await fetchPortfolio(
        clubInfo.club_wallet_address!
      );

      // Step 4: fetch club members
      let memberInfo = [] as IMemberInfoData[];
      try {
        memberInfo = await fetchMemberInfo(clubInfo);
      } catch (err) {
        console.log(err);
      }

      return {
        props: {
          clubInfo: clubInfo,
          balance: balance,
          members: memberInfo,
        },
      };
    } catch (err) {
      console.log(err);
      return {
        props: {
          error: JSON.parse(JSON.stringify(err)),
        },
      };
    }
  }
};

const Dashboard: NextPageWithLayout<any> = ({
  ...serverProps
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { id } = router.query;
  return (
    <>
      {!serverProps.error ? (
        <div className="md:max-w-[1000px] w-full md:mx-auto px-4 pt-3 md:pt-12 pb-5 h-full md:flex md:flex-row md:items-start md:gap-6 flex flex-col gap-8">
          {/* Left panel */}
          <div className="flex flex-col items-start gap-8 w-full">
            {/* Club details and members */}
            <div className="flex flex-col items-start gap-4 w-full">
              <ClubDetails data={serverProps.clubInfo!} />
              <ClubMembers data={serverProps.members!} />
            </div>
            {/* Balance */}
            {/* TODO: have a global state setting for whether to show club or me balance */}
            <ClubBalance />
            {/* Portfolio */}
            <Portfolio
              data={serverProps.balance!}
              clubWalletAddress={serverProps.clubInfo?.club_wallet_address!}
            />
          </div>
          {/* Right panel */}
          <Suspense fallback={<LoadingWidget />}>
            <WidgetSection data={serverProps.clubInfo!} />
          </Suspense>
          {/* FOR TESTING SPLITTING */}
          <Splitting data={serverProps.clubInfo!} id={String(id)} />
        </div>
      ) : serverProps.error === "Not authed" ? (
        <NotAuthed />
      ) : (
        <NotVerified />
      )}
    </>
  );
};

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout>{page}</AppLayout>;
};

export default Dashboard;
