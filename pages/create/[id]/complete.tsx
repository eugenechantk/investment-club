import React, { ReactElement } from "react";
import { NextPageWithLayout } from "../../_app";
import AppLayout from "../../../layout/AppLayout";

import { Button } from "../../../components/Button/Button";
import { useRouter } from "next/router";
import { InferGetServerSidePropsType } from "next";
import { adminFirestore } from "../../../firebase/firebaseAdmin";
import { getDownloadURL, ref } from "firebase/storage";
import { clientStorage } from "../../../firebase/firebaseClient";
import Image from "next/image";

export const getServerSideProps = async (context: any) => {
  const { id } = context.params;
  // console.log(id);
  // Step 1: fetch the information about this club
  const res = await adminFirestore
    .collection("clubs")
    .doc(id)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return {
          notFound: true,
        };
      }
      return doc.data();
    })
    .then((data) => {
      return {
        props: {
          clubName: data!.club_name,
          profileImgUrl: data!.club_image,
        },
      };
    })
    .catch(() => {
      return {
        notFound: true,
      };
    });
  return {
    ...res,
  };
};

const StepComplete: NextPageWithLayout<any> = (
  serverProps: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  console.log(serverProps);
  const router = useRouter();
  const { id } = router.query;
  return (
    // Container to center the content
    <div className="flex flex-row items-center justify-center h-full w-full px-6">
      <div className="flex flex-col items-center justify-center gap-4 max-w-[480px]">
        <div className=" w-16 md:w-24 h-16 md:h-24 relative rounded-10 border-2 border-secondary-300 overflow-hidden">
          <Image
            src={serverProps.profileImgUrl}
            alt={`Profile image for ${serverProps.clubName}`}
            fill
          />
        </div>
        {/* TODO: render name of the club created */}
        <h3 className="text-center">Welcome to {serverProps.clubName}</h3>
        <p className="text-center">
          In your club, you can raise money from your friends and invest
          together in cryptocurrencies
        </p>
        <Button className="w-[245px]" onClick={() => router.push(`/${id}`)}>
          <h3>Go to club</h3>
        </Button>
      </div>
    </div>
  );
};

StepComplete.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout>{page}</AppLayout>;
};

export default StepComplete;
