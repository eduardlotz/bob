import { FillColumn, HugColumn } from "@/layout";
import { Divider } from "@/layout/atoms";
import styled from "styled-components";
import { useI18n } from "@/i18n";

export const CreditsIcon = () => (
  <img src="/images/app-logos/credits.png" height={80} width={80} />
);

export const CreditsApp = () => {
  const { messages } = useI18n();

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
        <h5>{messages.credits.sections.inspirations}</h5>
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
        <h5>{messages.credits.sections.models}</h5>
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
        <p>
          Coffee Table <b>by Francisco Hui</b>via Poly Pizza
        </p>
      </ListSectionItem>
      <ListSectionItem>
        <h5>{messages.credits.sections.sounds}</h5>
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
        <h5>{messages.credits.sections.icons}</h5>
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
        <h5>{messages.credits.sections.tools}</h5>
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
  background: rgba(33, 33, 33, 0.05);
  color: #212121;

  h5 {
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.3;
    opacity: 0.7;
    text-decoration: none;

    b,
    a {
      font-weight: 500;
    }
  }
`;
