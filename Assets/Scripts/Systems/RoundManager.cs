using System.Collections;
using System.Collections.Generic;
using CrossFireX.Abilities;
using CrossFireX.Players;
using CrossFireX.Weapons;
using UnityEngine;
using UnityEngine.Events;

namespace CrossFireX.Systems
{
    /// <summary>
    /// Drives the core round loop and assigns adaptive loadouts to players each round.
    /// Attach to a network/session authority (e.g., host) and hook into UI for timers.
    /// </summary>
    public class RoundManager : MonoBehaviour
    {
        [Header("Timing")]
        [SerializeField, Tooltip("Seconds players have to view loadouts and ready up.")]
        private float preRoundSeconds = 12f;
        [SerializeField, Tooltip("Duration of the live round phase.")]
        private float actionSeconds = 90f;
        [SerializeField, Tooltip("Buffer after a round ends before shuffling abilities.")]
        private float roundEndSeconds = 6f;

        [Header("Content Pools")]
        [SerializeField] private AbilityPool abilityPool;
        [SerializeField] private List<WeaponDefinition> primaryOptions = new();
        [SerializeField] private List<WeaponDefinition> sidearmOptions = new();

        [Header("Players")]
        [SerializeField] private List<PlayerAbilityController> playerAbilityControllers = new();

        [Header("Events")]
        public UnityEvent<int, RoundPhase> onRoundPhaseChanged;
        public UnityEvent<int> onLoadoutsRolled;

        private int roundIndex;
        private RoundPhase currentPhase = RoundPhase.None;
        private readonly Dictionary<PlayerAbilityController, PlayerLoadout> activeLoadouts = new();
        private System.Random random;

        private void Awake()
        {
            random = new System.Random();
        }

        public void BeginMatch()
        {
            StopAllCoroutines();
            StartCoroutine(RunLoop());
        }

        private IEnumerator RunLoop()
        {
            while (true)
            {
                roundIndex++;
                yield return RunPhase(RoundPhase.PreRound, preRoundSeconds, RollLoadoutsForPlayers);
                yield return RunPhase(RoundPhase.Action, actionSeconds);
                yield return RunPhase(RoundPhase.RoundEnd, roundEndSeconds);
            }
        }

        private IEnumerator RunPhase(RoundPhase phase, float durationSeconds, System.Action onPhaseStart = null)
        {
            currentPhase = phase;
            onPhaseStart?.Invoke();
            onRoundPhaseChanged?.Invoke(roundIndex, phase);

            float elapsed = 0f;
            while (elapsed < durationSeconds)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }
        }

        private void RollLoadoutsForPlayers()
        {
            foreach (PlayerAbilityController controller in playerAbilityControllers)
            {
                AbilityDefinition ability = abilityPool.RollAbility(random);
                WeaponDefinition primary = ChooseWeapon(primaryOptions, WeaponSlot.Primary);
                WeaponDefinition sidearm = ChooseWeapon(sidearmOptions, WeaponSlot.Sidearm);

                controller.SetAbility(ability);
                activeLoadouts[controller] = new PlayerLoadout(primary, sidearm, ability);
            }

            onLoadoutsRolled?.Invoke(roundIndex);
        }

        private WeaponDefinition ChooseWeapon(List<WeaponDefinition> options, WeaponSlot requiredSlot)
        {
            List<WeaponDefinition> candidates = options.FindAll(w => w.Slot == requiredSlot);
            if (candidates.Count == 0)
            {
                Debug.LogWarning($"RoundManager: No weapons configured for slot {requiredSlot}");
                return null;
            }

            int index = random.Next(candidates.Count);
            return candidates[index];
        }

        public PlayerLoadout GetLoadoutFor(PlayerAbilityController controller)
        {
            return activeLoadouts.TryGetValue(controller, out PlayerLoadout loadout) ? loadout : null;
        }
    }
}
