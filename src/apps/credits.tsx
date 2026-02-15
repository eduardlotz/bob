import { FillColumn, FillRow, HugColumn } from "@/layout";
import { Divider } from "@/layout/atoms";
import { CameraViewId, useQuestStore } from "@/store";
import styled from "styled-components";

export const CreditsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 1H56C68.7025 1 79 11.2975 79 24V56C79 68.7025 68.7025 79 56 79H24C11.2975 79 1 68.7025 1 56V24C1 11.2975 11.2975 1 24 1Z"
      fill="#BD79A5"
      stroke="#B782A5"
      strokeWidth={2}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M31.3128 20.6444C37.2225 19.7852 42.8033 19.7852 48.713 20.6444C52.409 21.1818 55.2975 24.2401 55.6321 28.009C56.2524 34.9914 56.4558 41.8829 55.8835 48.9414C55.8855 49.0051 55.8847 49.0694 55.8813 49.134C55.8338 49.9811 55.3015 50.722 54.5195 51.03C53.3998 51.4706 52.9204 52.1186 52.9204 53.0554C52.9204 53.9923 53.3998 54.64 54.5193 55.0809C55.3013 55.3886 55.8335 56.1297 55.8807 56.9769C55.9278 57.8237 55.4815 58.6206 54.7384 59.0151C53.8538 59.4851 52.8398 59.7574 51.7944 59.7969C44.5753 60.0677 37.4425 60.0677 30.2233 59.7969C28.3519 59.7266 26.7599 58.9466 25.6605 57.6331C24.588 56.352 24.1014 54.7083 24.1014 53.0551C24.1014 52.982 24.1024 52.9089 24.1043 52.836C23.6173 44.5337 23.6553 36.3227 24.3937 28.009C24.7284 24.2401 27.6169 21.1818 31.3128 20.6444ZM28.3891 52.928C28.3878 52.9697 28.3871 53.0123 28.3871 53.0551C28.3871 53.8751 28.6271 54.4711 28.9325 54.836C29.2111 55.1689 29.6483 55.4411 30.3824 55.4689C36.6547 55.7043 42.8598 55.732 49.1161 55.5523C48.811 54.8249 48.6347 53.9943 48.6347 53.0554C48.6347 52.1163 48.8113 51.2857 49.1164 50.5583C42.8599 50.3783 36.6547 50.4063 30.3824 50.6417C30.0355 50.6546 29.7549 50.7223 29.526 50.8254C29.2869 50.9329 29.1053 51.0783 28.9641 51.238C28.6639 51.5771 28.4209 52.1289 28.3906 52.8963L28.3891 52.928ZM50.8895 30.7939C50.6441 30.3195 50.1547 30.0215 49.6207 30.0215H43.0062C42.2172 30.0215 41.5776 30.6611 41.5776 31.4501C41.5776 32.2391 42.2172 32.8787 43.0062 32.8787H46.8581L41.427 40.5461C41.1183 40.9819 41.0785 41.5536 41.3238 42.028C41.5692 42.5024 42.0587 42.8004 42.5928 42.8004H50.0341C50.823 42.8004 51.4627 42.1608 51.4627 41.3718C51.4627 40.5828 50.823 39.9432 50.0341 39.9432H45.3553L50.7864 32.2759C51.095 31.84 51.135 31.2683 50.8895 30.7939ZM33.1199 30.5524L34.1695 27.4036L35.2191 30.5524H33.1199ZM36.613 25.6991L38.5458 31.4975C38.5533 31.5183 38.5603 31.5393 38.5668 31.5604L39.6588 34.8364C39.9083 35.5849 39.5037 36.3939 38.7553 36.6434C38.0068 36.8929 37.1977 36.4884 36.9483 35.7399L36.1714 33.4095H32.1675L31.3907 35.7399C31.1412 36.4884 30.3322 36.8929 29.5837 36.6434C28.8352 36.3939 28.4307 35.5849 28.6802 34.8364L29.7722 31.5604C29.7787 31.5393 29.7857 31.5183 29.7931 31.4975L31.7259 25.6991C32.0765 24.6473 33.0608 23.9379 34.1695 23.9379C35.2781 23.9379 36.2624 24.6473 36.613 25.6991Z"
      fill="#FFD7F1"
    />
  </svg>
);

export const CreditsApp = () => {
  return (
    <HugColumn
      style={{
        width: "20rem",
        maxWidth: "100%",
        maxHeight: "50vh",
        overflowY: "auto",
        borderRadius: "1.25rem",
      }}
      $gap={"0.25rem"}
      layoutRoot
    >
      <ListSectionItem>
        <h5>Inspirations</h5>
        <Divider />
        <p>
          Bruno Simon{" "}
          <b>
            <a target="_blank" href="https://bruno-simon.com">
              bruno-simon.com
            </a>
          </b>
        </p>

        <p>
          Benji Taylor{" "}
          <b>
            <a target="_blank" href="https://benji.org">
              benji.org
            </a>
          </b>
        </p>

        <p>
          Chester's "Digital Garden"{" "}
          <b>
            <a target="_blank" href="https://chester.how/">
              chester.how
            </a>
          </b>
        </p>

        <p>
          Nate Parrott{" "}
          <b>
            <a target="_blank" href="https://nateparrott.com/">
              nateparrott.com
            </a>
          </b>
        </p>

        <p>
          Neal Agarwal{" "}
          <b>
            <a target="_blank" href="https://neal.fun">
              neal.fun
            </a>
          </b>
        </p>

        <p>
          Xavier (Jack){" "}
          <a target="_blank" href="https://kmk0.com">
            kmk0.com
          </a>
        </p>
      </ListSectionItem>
      <ListSectionItem>
        <h5>3D Models</h5>
        <Divider />
        <p>
          Tree, Macbook, Table & Bookshelf <b>by pmndrs</b> (market.pmnd.rs/)
        </p>
        <p>
          Krusty Krab Employee Hat (Spongebob) <b>by Yanez Designs</b>{" "}
          (skfb.ly/6CzyA)
        </p>
        <p>
          Round Glasses from "Chicken Little wearing Lewis glasses"{" "}
          <b>by Jamessmartguy</b> (skfb.ly/pynry)
        </p>
        <p>
          Builder Helmet from "Bob the Builder" <b>by HiT Entertainment</b>{" "}
          (skfb.ly/pqYNx)
        </p>
        <p>
          1990s Low Poly Camera <b>by elomation</b> (skfb.ly/oxr7C)
        </p>
        <p>
          Dualshock (PS1) <b>by YoukaiDrawing is licensed</b> (skfb.ly/oItXN)
        </p>
        <p>
          Videogame Controller <b>by Google</b> (poly.pizza/m/6365MG_Pr_f)
        </p>
        <p>
          Midi controller <b>by Gabriel Ibias</b> (poly.pizza/m/155LOgjwUy2)
        </p>
        <p>
          Keyboard Controller "Piano" <b>by daniele100</b>{" "}
          (poly.pizza/m/DcLRWpe0YV)
        </p>
        <p>
          Skateboard <b>by Kenney</b> (poly.pizza/m/TyiZbm5TNL)
        </p>
        <p>
          Soccer goal <b>by Poly by Google</b> via Poly Pizza
        </p>
        <p>
          Table Tennis Paddle <b>by jeremy</b> (poly.pizza/m/2UlIPzTzLM9)
        </p>
      </ListSectionItem>
      <ListSectionItem>
        <h5>Sounds & Music</h5>
        <Divider />
        <p>
          Interface Sounds <b>by Kenney</b> (kenney.nl/assets/interface-sounds)
        </p>
        <p>
          Big Pink Noise Loop for Sleeping <b>by Kajetan Kwaśniewski</b>{" "}
          (youtube.com/watch?v=Ro_hheF2ao0)
        </p>
        <Divider />
        <p>
          Jazz Piano Medley <b>by Tri-Tachyon</b> -
          https://soundcloud.com/tri-tachyon/albums
        </p>
      </ListSectionItem>
      <ListSectionItem>
        <h5>Icons & Fonts</h5>
        <Divider />
        <p>
          Line Icons <b>by Untitled UI</b> (untitledui.com)
        </p>
        <p>
          Ultimate Bold <b>by Streamline</b> (streamlinehq.com)
        </p>
        <Divider />
        <p>
          Open Sauce Two <b>by Alfredo Marco Pradil</b>{" "}
          (github.com/marcologous/Open-Sauce-Fonts)
        </p>
        <p>
          Open Runde <b>by Laurids Kern</b> (github.com/lauridskern/open-runde)
        </p>
      </ListSectionItem>
      <ListSectionItem>
        <h5>Tools & Technologies</h5>
        <Divider />

        <p>gltf.pmnd.rs</p>
        <p>Blender</p>
        <p>Figma</p>
        <p>Auxy</p>

        <Divider />

        <p>threejs</p>
        <p>react-three/fiber</p>
        <p>react-three/drei</p>
        <p>react-three/rapier</p>
        <p>motion/react</p>
        <p>react-spring/three</p>
        <p>react</p>
        <p>typescript</p>
        <p>react-router</p>
        <p>styled-components</p>
      </ListSectionItem>
    </HugColumn>
  );
};

const QuestIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 2rem;
  min-width: 2rem;
  border: 2.5px solid #fff;
  border-radius: 0.625rem;
  opacity: 0.4;
`;

const ListSectionItem = styled(FillColumn)`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  padding: 1rem;
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.05);

  h5 {
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.3;
    color: rgba(0255, 255, 255, 0.6);
    text-decoration: none;

    b,
    a {
      color: rgba(0255, 255, 255, 1);
      font-weight: 500;
    }
  }
`;
